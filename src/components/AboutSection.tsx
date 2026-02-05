import { motion } from "framer-motion";
import { MapPin, GraduationCap, Calendar } from "lucide-react";

const AboutSection = () => {
  const age = Math.floor(
    (new Date().getTime() - new Date("2004-04-20").getTime()) /
      (1000 * 60 * 60 * 24 * 365.25)
  );

  return (
    <section id="sobre" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold font-display mb-2">
            <span className="gradient-text">Sobre</span> Mim
          </h2>
          <div className="w-20 h-1 bg-primary rounded-full mb-8" />
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-6"
          >
            <p className="text-lg text-muted-foreground leading-relaxed">
              Sou um desenvolvedor apaixonado por transformar ideias em código funcional. 
              Minha jornada começou com curiosidade por entender como as coisas funcionam 
              e evoluiu para uma carreira focada em criar experiências digitais impactantes.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Atualmente cursando <strong className="text-foreground">Engenharia de Software</strong>, 
              combino conhecimento acadêmico com projetos práticos que vão desde 
              <strong className="text-foreground"> plataformas de e-commerce multi-tenant</strong> até 
              <strong className="text-foreground"> aplicativos mobile nativos</strong> para gestão empresarial.
            </p>

            <div className="flex flex-wrap gap-4 pt-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4 text-primary" />
                <span>Curitiba, PR</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4 text-primary" />
                <span>{age} anos</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <GraduationCap className="w-4 h-4 text-primary" />
                <span>Eng. de Software</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="glass-card p-8"
          >
            <h3 className="text-xl font-bold font-display mb-6">Stack Principal</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { name: "JavaScript", level: 90 },
                { name: "React", level: 85 },
                { name: "Java Android", level: 85 },
                { name: "Python", level: 75 },
                { name: "SQL", level: 80 },
                { name: "C#", level: 70 },
              ].map((skill) => (
                <div key={skill.name} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{skill.name}</span>
                    <span className="text-muted-foreground">{skill.level}%</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${skill.level}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: 0.5 }}
                      className="h-full bg-primary rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
