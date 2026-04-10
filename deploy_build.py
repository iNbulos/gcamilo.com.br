import os
import stat
from pathlib import Path

import paramiko

# ==== CONFIGURAÇÃO DO SERVIDOR ====
HOST = "72.60.0.117"       # ex: "123.123.123.123"
PORT = 22
USERNAME = "nbulos"

# use EITHER PASSWORD or KEY_FILE (deixa o outro como None)
PASSWORD = "Gc*20049534"    # ou None se usar chave
KEY_FILE = None               # ex: r"C:\Users\Gabriel\.ssh\id_rsa"


# ==== CAMINHOS ====
LOCAL_DIST = Path(r'D:\Projects\gcamilo.com.br\dist')

REMOTE_BUILDS = [ 
    "/var/www/gcamilo.com.br/build"
]


def connect_ssh():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    if KEY_FILE:
        key = paramiko.RSAKey.from_private_key_file(KEY_FILE)
        client.connect(HOST, PORT, USERNAME, pkey=key)
    else:
        client.connect(HOST, PORT, USERNAME, PASSWORD)
    return client


def ensure_dir(sftp, remote_path: str):
    """Cria diretório remoto recursivamente, se não existir."""
    parts = remote_path.strip("/").split("/")
    path = ""
    for part in parts:
        path += "/" + part
        try:
            sftp.stat(path)
        except IOError:
            sftp.mkdir(path)


def remove_dir_contents(sftp, remote_path: str):
    """Apaga TUDO dentro de remote_path, mas mantém a pasta."""
    try:
        for attr in sftp.listdir_attr(remote_path):
            remote_item = f"{remote_path}/{attr.filename}"
            if stat.S_ISDIR(attr.st_mode):
                remove_dir_recursive(sftp, remote_item)
            else:
                sftp.remove(remote_item)
    except IOError:
        # pasta talvez não exista, ignorar
        pass


def remove_dir_recursive(sftp, remote_path: str):
    """Apaga diretório remoto recursivamente (tipo rm -rf)."""
    try:
        for attr in sftp.listdir_attr(remote_path):
            remote_item = f"{remote_path}/{attr.filename}"
            if stat.S_ISDIR(attr.st_mode):
                remove_dir_recursive(sftp, remote_item)
            else:
                sftp.remove(remote_item)
        sftp.rmdir(remote_path)
    except IOError:
        pass


def upload_dir(sftp, local_dir: Path, remote_dir: str):
    """Sobe todo o conteúdo de local_dir para remote_dir."""
    local_dir = Path(local_dir)
    for root, dirs, files in os.walk(local_dir):
        rel = os.path.relpath(root, local_dir)
        if rel == ".":
            remote_root = remote_dir
        else:
            remote_root = remote_dir.rstrip("/") + "/" + rel.replace("\\", "/")

        # garante pasta remota
        try:
            sftp.stat(remote_root)
        except IOError:
            sftp.mkdir(remote_root)

        for file in files:
            local_file = os.path.join(root, file)
            remote_file = remote_root.rstrip("/") + "/" + file
            sftp.put(local_file, remote_file)


def main():
    if not LOCAL_DIST.exists():
        raise SystemExit(f"Build não encontrado: {LOCAL_DIST}")

    print(f"🔧 Conectando em {HOST}...")
    client = connect_ssh()
    sftp = client.open_sftp()

    try:
        for remote_build in REMOTE_BUILDS:
            print(f"\n➡ Publicando em {remote_build}...")

            # garante que a pasta build exista
            ensure_dir(sftp, remote_build)

            # limpa conteúdo antigo
            print("  - Limpando conteúdo antigo...")
            remove_dir_contents(sftp, remote_build)

            # envia novo dist
            print("  - Enviando novo build...")
            upload_dir(sftp, LOCAL_DIST, remote_build)

            print("  ✅ Ok!")

    finally:
        sftp.close()
        client.close()
        print("\n🚀 Deploy finalizado.")


if __name__ == "__main__":
    main()
