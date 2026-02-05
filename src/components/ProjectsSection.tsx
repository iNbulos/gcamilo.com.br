import { motion } from "framer-motion";
import { ExternalLink, Github, ShoppingCart, Calendar, FlaskConical } from "lucide-react";

const projects = [
  {
    title: "E-commerce Multi-Tenant",
    subtitle: "gcamilo.shop",
    description:
      "Plataforma SPA completa de e-commerce com arquitetura multi-tenant. O mesmo código base opera lojas diferentes conectando-se dinamicamente a backends Firebase distintos baseado na URL.",
    highlights: [
      "React 19 + Vite",
      "Firebase (Auth + Firestore)",
      "Tailwind CSS 4",
      "Dark/Light Theme",
      "Painel Admin completo",
      "Radix UI + Wouter",
    ],
    icon: ShoppingCart,
    color: "from-emerald-500 to-cyan-500",
    link: "https://gcamilo.shop",
  },
  {
    title: "Meu Negócio",
    subtitle: "App Android",
    description:
      "Aplicativo de gestão empresarial para prestadores de serviços. Centraliza agenda, controle de clientes e finanças com múltiplas vistas (diária, semanal, mensal) e relatórios de performance.",
    highlights: [
      "Java Android Nativo",
      "SQLite local",
      "Fragments + ViewPager",
      "Custom Charts",
      "Integração WhatsApp",
      "CRM integrado",
    ],
    icon: Calendar,
    color: "from-violet-500 to-purple-500",
  },
  {
    title: "App Óleos - Lactec",
    subtitle: "App Android",
    description:
      "Terminal móvel para técnicos de laboratório registrarem dados de ensaios em campo. Fluxo completo de identificação de amostras, preenchimento de dados técnicos e sincronização com sistema central.",
    highlights: [
      "Java Android Nativo",
      "API REST customizada",
      "SQLite + Sync",
      "Leitura de etiquetas",
      "Workflow de ensaios",
      "Offline-first",
    ],
    icon: FlaskConical,
    color: "from-amber-500 to-orange-500",
  },
];

const ProjectsSection = () => {
  return (
    <section id="projetos" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold font-display mb-2">
            Projetos em <span className="gradient-text">Destaque</span>
          </h2>
          <div className="w-20 h-1 bg-primary rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Soluções reais que criei, desde plataformas web até apps mobile nativos
          </p>
        </motion.div>

        <div className="space-y-8">
          {projects.map((project, index) => (
            <motion.div
              key={project.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="glass-card overflow-hidden group"
            >
              <div className="p-8 md:p-10">
                <div className="flex flex-col md:flex-row md:items-start gap-6">
                  {/* Icon */}
                  <div
                    className={`p-4 rounded-xl bg-gradient-to-br ${project.color} shrink-0`}
                  >
                    <project.icon className="w-8 h-8 text-white" />
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-3">
                      <h3 className="text-2xl font-bold font-display">
                        {project.title}
                      </h3>
                      <span className="text-primary text-sm font-medium px-3 py-1 rounded-full bg-primary/10 w-fit">
                        {project.subtitle}
                      </span>
                    </div>

                    <p className="text-muted-foreground mb-6 max-w-3xl">
                      {project.description}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-6">
                      {project.highlights.map((tech) => (
                        <span
                          key={tech}
                          className="px-3 py-1 text-sm rounded-md bg-secondary text-foreground/80"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>

                    {project.link && (
                      <a
                        href={project.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Visitar projeto
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProjectsSection;
