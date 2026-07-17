import { FiStar } from "react-icons/fi";
import Badge from "@/components/ui/Badge";
import Container from "@/components/ui/Container";
import Heading from "@/components/ui/Heading";
import Section from "@/components/ui/Section";
import TestimonialCard from "@/components/ui/TestimonialCard";
import Avatar from "@/components/ui/Avatar";

const testimonials = [
  { quote: "AeroPrep helped me turn scattered notes into a focused revision plan before my DGCA exam.", author: "Aarav S.", role: "Aircraft Maintenance Student" },
  { quote: "The mock exams felt close to the real thing and sharpened my timing dramatically.", author: "Meera P.", role: "EASA Prep Candidate" },
  { quote: "The study flow made my revision feel calm, structured, and much easier to sustain.", author: "Rohan D.", role: "AME Apprentice" },
] as const;

export default function TestimonialsSection() {
  return (
    <Section className="bg-slate-50/70">
      <Container>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <Badge variant="accent">Testimonials</Badge>
            <Heading as="h2" size="md" className="mt-4">
              Trusted by learners preparing for the highest-stakes exams.
            </Heading>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <FiStar className="h-4 w-4 text-amber-500" />
            Rated 4.9/5 by aviation students
          </div>
        </div>
        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {testimonials.map((testimonial) => (
            <TestimonialCard key={testimonial.author} {...testimonial} avatar={<Avatar name={testimonial.author} size="md" />} />
          ))}
        </div>
      </Container>
    </Section>
  );
}
