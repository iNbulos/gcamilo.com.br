import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Send } from "lucide-react";

const ContactSection = () => {
  return (
    <section id="contato" className="py-24 px-6 bg-card/30">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold font-display mb-2">
            Vamos <span className="gradient-text">Conversar</span>?
          </h2>
          <div className="w-20 h-1 bg-primary rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground max-w-xl mx-auto">
            Estou disponível para novos projetos e oportunidades. 
            Entre em contato e vamos criar algo incrível juntos!
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          <motion.a
            href="mailto:gabrielcamilom15@gmail.com"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="glass-card p-6 text-center hover:border-primary/50 transition-colors group"
          >
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary transition-colors">
              <Mail className="w-6 h-6 text-primary group-hover:text-primary-foreground transition-colors" />
            </div>
            <h3 className="font-bold font-display mb-1">Email</h3>
            <p className="text-sm text-muted-foreground break-all">
              gabrielcamilom15@gmail.com
            </p>
          </motion.a>

          <motion.a
            href="https://wa.me/5541996129534"
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="glass-card p-6 text-center hover:border-primary/50 transition-colors group"
          >
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary transition-colors">
              <Phone className="w-6 h-6 text-primary group-hover:text-primary-foreground transition-colors" />
            </div>
            <h3 className="font-bold font-display mb-1">WhatsApp</h3>
            <p className="text-sm text-muted-foreground">
              (41) 99612-9534
            </p>
          </motion.a>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="glass-card p-6 text-center"
          >
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <MapPin className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-bold font-display mb-1">Localização</h3>
            <p className="text-sm text-muted-foreground">
              Curitiba, Paraná
            </p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-12 text-center"
        >
          <a
            href="mailto:gabrielcamilom15@gmail.com"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-lg font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
          >
            <Send className="w-5 h-5" />
            Enviar Mensagem
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default ContactSection;
