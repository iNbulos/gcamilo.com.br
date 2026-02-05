import { motion } from "framer-motion";
import { 
  Smartphone, 
  Globe, 
  Database, 
  Terminal, 
  Code2, 
  Layers 
} from "lucide-react";

const skills = [
  {
    category: "Frontend",
    icon: Globe,
    items: ["React", "JavaScript", "HTML", "CSS", "Tailwind"],
  },
  {
    category: "Mobile",
    icon: Smartphone,
    items: ["Java Android", "Android SDK", "XML Layouts"],
  },
  {
    category: "Backend",
    icon: Terminal,
    items: ["Python", "C#", "VBA", "Firebase"],
  },
  {
    category: "Databases",
    icon: Database,
    items: ["SQL", "DAX", "SQLite", "Firestore"],
  },
  {
    category: "DevOps",
    icon: Layers,
    items: ["Linux", "Git", "Vite"],
  },
  {
    category: "Outros",
    icon: Code2,
    items: ["Power BI", "REST APIs"],
  },
];

const SkillsSection = () => {
  return (
    <section id="skills" className="py-24 px-6 bg-card/30">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold font-display mb-2">
            <span className="gradient-text">Tecnologias</span> & Skills
          </h2>
          <div className="w-20 h-1 bg-primary rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Ferramentas e tecnologias que utilizo para dar vida aos projetos
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {skills.map((skill, index) => (
            <motion.div
              key={skill.category}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="glass-card p-6 hover:border-primary/30 transition-colors group"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <skill.icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold font-display">{skill.category}</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {skill.items.map((item) => (
                  <span key={item} className="skill-badge">
                    {item}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SkillsSection;
