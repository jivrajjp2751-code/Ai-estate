import { motion } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { api as supabase } from "@/lib/api";
import { Phone, Mail, MapPin, Calendar, DollarSign, Clock, User, Send, Sparkles, ArrowRight } from "lucide-react";
import { z } from "zod";
import { ScrollReveal } from "./ScrollAnimations";

const inquirySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100).trim(),
  email: z.string().email("Please enter a valid email address").max(255).trim(),
  phone: z.string().min(10, "Phone number must be at least 10 characters").max(20).trim(),
  preferredArea: z.string().max(100).optional().or(z.literal("")),
  budget: z.string().max(50).optional().or(z.literal("")),
  preferredTime: z.string().max(50).optional().or(z.literal("")),
  appointmentDate: z.string().optional().or(z.literal("")),
  message: z.string().max(2000).optional().or(z.literal("")),
});

const ContactSection = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "", email: "", phone: "", preferredArea: "", customArea: "",
    budget: "", customBudget: "", preferredTime: "", appointmentDate: "", message: "",
  });
  const [showCustomArea, setShowCustomArea] = useState(false);
  const [showCustomBudget, setShowCustomBudget] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    if (name === "preferredArea") {
      if (value === "other") { setShowCustomArea(true); setFormData((prev) => ({ ...prev, preferredArea: "" })); }
      else { setShowCustomArea(false); setFormData((prev) => ({ ...prev, preferredArea: value, customArea: "" })); }
    } else if (name === "budget") {
      if (value === "other") { setShowCustomBudget(true); setFormData((prev) => ({ ...prev, budget: "" })); }
      else { setShowCustomBudget(false); setFormData((prev) => ({ ...prev, budget: value, customBudget: "" })); }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const validationResult = inquirySchema.safeParse(formData);
      if (!validationResult.success) {
        toast({ title: "Validation Error", description: validationResult.error.errors[0].message, variant: "destructive" });
        setIsSubmitting(false);
        return;
      }
      const validatedData = validationResult.data;
      const finalArea = showCustomArea && formData.customArea.trim() ? formData.customArea.trim() : validatedData.preferredArea;
      const finalBudget = showCustomBudget && formData.customBudget.trim() ? formData.customBudget.trim() : validatedData.budget;

      const { error } = await supabase.from("customer_inquiries").insert({
        name: validatedData.name, email: validatedData.email, phone: validatedData.phone,
        preferred_area: finalArea || null, budget: finalBudget || null,
        preferred_time: validatedData.preferredTime || null, appointment_date: validatedData.appointmentDate || null,
        message: validatedData.message?.trim() || null,
      });
      if (error) { toast({ title: "Submission Failed", description: "Please try again later.", variant: "destructive" }); return; }
      toast({ title: "Request Submitted!", description: "Our AI agent will call you at your preferred time." });
      setFormData({ name: "", email: "", phone: "", preferredArea: "", customArea: "", budget: "", customBudget: "", preferredTime: "", appointmentDate: "", message: "" });
      setShowCustomArea(false); setShowCustomBudget(false);
    } catch {
      toast({ title: "Something went wrong", description: "Please try again later.", variant: "destructive" });
    } finally { setIsSubmitting(false); }
  };

  const areas = ["Mumbai - Bandra", "Mumbai - Worli", "Mumbai - Andheri", "Mumbai - Powai", "Pune - Koregaon Park", "Pune - Hinjewadi", "Pune - Kothrud", "Nashik", "Nagpur", "Lonavala", "Alibaug", "Panchgani"];
  const budgetRanges = ["Under ₹50 Lakh", "₹50 Lakh - ₹1 Cr", "₹1 Cr - ₹3 Cr", "₹3 Cr - ₹5 Cr", "₹5 Cr - ₹10 Cr", "Above ₹10 Cr"];
  const timeSlots = ["9:00 AM - 11:00 AM", "11:00 AM - 1:00 PM", "1:00 PM - 3:00 PM", "3:00 PM - 5:00 PM", "5:00 PM - 7:00 PM", "7:00 PM - 9:00 PM"];

  const contactInfo = [
    { icon: Phone, title: "Phone", value: "+91 98765 43210", color: "bg-blue-50 text-blue-500" },
    { icon: Mail, title: "Email", value: "hello@aiestateagent.in", color: "bg-violet-50 text-violet-500" },
    { icon: MapPin, title: "Office", value: "Tower A, Bandra Kurla Complex\nMumbai, Maharashtra 400051", color: "bg-emerald-50 text-emerald-500" },
    { icon: Clock, title: "AI Available", value: "24/7 - Always Ready to Help", color: "bg-amber-50 text-amber-500" },
  ];

  return (
    <section id="contact" className="py-20 md:py-28 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-secondary/30 to-transparent pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-14">
          <ScrollReveal>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Get Connected</span>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={0.1}>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-3">
              Get Your <span className="gradient-text">AI Call</span>
            </h2>
          </ScrollReveal>
          <ScrollReveal delay={0.2}>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Fill in your details and our AI agent will call you at your preferred time.
            </p>
          </ScrollReveal>
        </div>

        <div className="grid lg:grid-cols-5 gap-8 max-w-5xl mx-auto">
          {/* Contact Info */}
          <ScrollReveal direction="left" className="lg:col-span-2 space-y-4">
            {contactInfo.map((item, index) => (
              <div key={index} className="p-4 rounded-xl bg-white border border-border hover:border-primary/20 hover:shadow-sm transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-lg ${item.color} flex items-center justify-center shrink-0`}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-xs text-muted-foreground uppercase tracking-wider mb-1">{item.title}</p>
                    <p className="text-foreground text-sm whitespace-pre-line">{item.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </ScrollReveal>

          {/* Form */}
          <ScrollReveal direction="right" delay={0.2} className="lg:col-span-3">
            <form onSubmit={handleSubmit} className="p-6 md:p-8 rounded-2xl bg-white border border-border space-y-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Phone className="w-4 h-4 text-primary" />
                </div>
                <h3 className="font-display text-xl font-semibold">Schedule a Call</h3>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="flex items-center gap-1.5 text-sm"><User className="w-3.5 h-3.5 text-primary" /> Full Name</Label>
                  <Input id="name" name="name" placeholder="Rahul Sharma" value={formData.name} onChange={handleInputChange} required className="rounded-lg" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="flex items-center gap-1.5 text-sm"><Mail className="w-3.5 h-3.5 text-primary" /> Email</Label>
                  <Input id="email" name="email" type="email" placeholder="rahul@example.com" value={formData.email} onChange={handleInputChange} required className="rounded-lg" />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="flex items-center gap-1.5 text-sm"><Phone className="w-3.5 h-3.5 text-primary" /> Phone</Label>
                  <Input id="phone" name="phone" type="tel" placeholder="+91 98765 43210" value={formData.phone} onChange={handleInputChange} required className="rounded-lg" />
                </div>
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-sm"><MapPin className="w-3.5 h-3.5 text-primary" /> Preferred Area</Label>
                  {showCustomArea ? (
                    <div className="flex gap-2">
                      <Input name="customArea" placeholder="Enter area" value={formData.customArea} onChange={handleInputChange} className="flex-1 rounded-lg" />
                      <Button type="button" variant="outline" size="icon" onClick={() => { setShowCustomArea(false); setFormData((prev) => ({ ...prev, customArea: "" })); }} className="shrink-0 rounded-lg">✕</Button>
                    </div>
                  ) : (
                    <Select value={formData.preferredArea} onValueChange={(v) => handleSelectChange("preferredArea", v)}>
                      <SelectTrigger className="rounded-lg"><SelectValue placeholder="Select area" /></SelectTrigger>
                      <SelectContent>
                        {areas.map((area) => (<SelectItem key={area} value={area}>{area}</SelectItem>))}
                        <SelectItem value="other" className="text-primary font-medium">+ Other</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-sm"><DollarSign className="w-3.5 h-3.5 text-primary" /> Budget</Label>
                  {showCustomBudget ? (
                    <div className="flex gap-2">
                      <Input name="customBudget" placeholder="e.g., ₹2.5 Cr" value={formData.customBudget} onChange={handleInputChange} className="flex-1 rounded-lg" />
                      <Button type="button" variant="outline" size="icon" onClick={() => { setShowCustomBudget(false); setFormData((prev) => ({ ...prev, customBudget: "" })); }} className="shrink-0 rounded-lg">✕</Button>
                    </div>
                  ) : (
                    <Select value={formData.budget} onValueChange={(v) => handleSelectChange("budget", v)}>
                      <SelectTrigger className="rounded-lg"><SelectValue placeholder="Select budget" /></SelectTrigger>
                      <SelectContent>
                        {budgetRanges.map((range) => (<SelectItem key={range} value={range}>{range}</SelectItem>))}
                        <SelectItem value="other" className="text-primary font-medium">+ Other</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-sm"><Clock className="w-3.5 h-3.5 text-primary" /> Call Time</Label>
                  <Select value={formData.preferredTime} onValueChange={(v) => handleSelectChange("preferredTime", v)}>
                    <SelectTrigger className="rounded-lg"><SelectValue placeholder="Select time" /></SelectTrigger>
                    <SelectContent>
                      {timeSlots.map((slot) => (<SelectItem key={slot} value={slot}>{slot}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="appointmentDate" className="flex items-center gap-1.5 text-sm"><Calendar className="w-3.5 h-3.5 text-primary" /> Visit Date</Label>
                <Input id="appointmentDate" name="appointmentDate" type="date" value={formData.appointmentDate} onChange={handleInputChange} min={new Date().toISOString().split("T")[0]} className="rounded-lg" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="message" className="text-sm">Additional Notes (Optional)</Label>
                <Textarea id="message" name="message" placeholder="Tell us about your ideal property..." value={formData.message} onChange={handleInputChange} rows={3} className="resize-none rounded-lg" />
              </div>

              <Button type="submit" variant="hero" size="lg" className="w-full rounded-lg" disabled={isSubmitting}>
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit Request
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </form>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
