import { motion } from "framer-motion";
import { MapPin, Bed, Bath, Square, Heart, Eye, GitCompare, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useEffect, useMemo, useRef } from "react";
import { api as supabase } from "@/lib/api";
import PropertyDetailModal from "./PropertyDetailModal";
import PropertyComparisonModal from "./PropertyComparisonModal";
import PropertyFiltersComponent, { PropertyFilters } from "./PropertyFilters";
import { ScrollReveal } from "./ScrollAnimations";
import { toast } from "sonner";

interface Property {
  id: string;
  title: string;
  location: string;
  price: string;
  beds: number;
  baths: number;
  sqft: string;
  featured: boolean;
  primary_image_url: string | null;
  description?: string | null;
}

const PropertyCard = ({
  property,
  index,
  onViewDetails,
  isSelected,
  onToggleSelect
}: {
  property: Property;
  index: number;
  onViewDetails: (property: Property) => void;
  isSelected: boolean;
  onToggleSelect: (property: Property) => void;
}) => {
  const [isLiked, setIsLiked] = useState(false);

  return (
    <ScrollReveal delay={index * 0.08} distance={40}>
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className={`relative group overflow-hidden rounded-2xl bg-white border border-border hover:border-primary/20 hover:shadow-lg transition-all duration-300 ${isSelected ? "ring-2 ring-primary shadow-md" : ""
          }`}
      >
        {/* Selection Checkbox */}
        <div className="absolute top-4 left-4 z-10">
          <div
            className="w-7 h-7 rounded-lg bg-background/70 backdrop-blur-md flex items-center justify-center cursor-pointer hover:bg-background/90 transition-all duration-300 border border-border/50"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect(property);
            }}
          >
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => onToggleSelect(property)}
              className="border-foreground/50"
            />
          </div>
        </div>

        {/* Image Container */}
        <div
          className="relative h-64 overflow-hidden bg-secondary/50 cursor-pointer"
          onClick={() => onViewDetails(property)}
        >
          {property.primary_image_url ? (
            <motion.img
              src={property.primary_image_url}
              alt={property.title}
              className="w-full h-full object-cover"
              whileHover={{ scale: 1.08 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-secondary/50 to-muted/50">
              <span className="text-muted-foreground">No image</span>
            </div>
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent opacity-50" />

          {/* Featured Badge */}
          {property.featured && (
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="absolute top-4 right-14 px-3 py-1.5 rounded-full bg-gradient-to-r from-primary to-violet-500 text-primary-foreground text-xs font-semibold shadow-lg flex items-center gap-1.5"
            >
              <Sparkles className="w-3 h-3" />
              Featured
            </motion.div>
          )}

          {/* Like Button */}
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              setIsLiked(!isLiked);
            }}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-background/50 backdrop-blur-md flex items-center justify-center transition-all duration-300 hover:bg-background/80 border border-border/30"
            whileTap={{ scale: 0.85 }}
          >
            <Heart
              className={`w-5 h-5 transition-all duration-300 ${isLiked
                ? "fill-red-500 text-red-500 scale-110"
                : "text-foreground"
                }`}
            />
          </motion.button>

          {/* Price Tag */}
          <div className="absolute bottom-4 left-4">
            <div className="px-4 py-2 rounded-xl bg-background/80 backdrop-blur-md border border-border/30">
              <span className="text-xl md:text-2xl font-bold gradient-text">
                {property.price}
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <h3
            className="font-display text-xl font-semibold mb-2 group-hover:text-primary transition-colors duration-500 cursor-pointer"
            onClick={() => onViewDetails(property)}
          >
            {property.title}
          </h3>

          <div className="flex items-center text-muted-foreground mb-4">
            <MapPin className="w-4 h-4 mr-1.5 text-primary" />
            <span className="text-sm">{property.location}</span>
          </div>

          {/* Features */}
          <div className="flex items-center gap-4 mb-6">
            {[
              { icon: Bed, value: `${property.beds} Beds` },
              { icon: Bath, value: `${property.baths} Baths` },
              { icon: Square, value: `${property.sqft} sqft` },
            ].map((feature, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 text-sm text-muted-foreground px-2.5 py-1 rounded-lg bg-secondary"
              >
                <feature.icon className="w-3.5 h-3.5" />
                <span>{feature.value}</span>
              </div>
            ))}
          </div>

          <Button
            variant="outline"
            className="w-full group/btn rounded-xl hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-500"
            onClick={() => onViewDetails(property)}
          >
            <Eye className="w-4 h-4 mr-2 group-hover/btn:scale-110 transition-transform" />
            View Details
          </Button>
        </div>
      </motion.div>
    </ScrollReveal>
  );
};

const PropertiesSection = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedForComparison, setSelectedForComparison] = useState<Property[]>([]);
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);
  const [filters, setFilters] = useState<PropertyFilters>({
    search: "",
    priceMin: 0,
    priceMax: 200,
    bedsMin: 0,
    bedsMax: 20,
    sqftMin: 0,
    sqftMax: 50000,
    location: "all",
  });


  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProperties(data || []);
    } catch (error) {
      console.error("Error fetching properties:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = (property: Property) => {
    setSelectedProperty(property);
    setIsModalOpen(true);
  };

  const handleToggleSelect = (property: Property) => {
    setSelectedForComparison((prev) => {
      const isAlreadySelected = prev.some((p) => p.id === property.id);
      if (isAlreadySelected) {
        return prev.filter((p) => p.id !== property.id);
      }
      if (prev.length >= 4) {
        toast.warning("You can compare up to 4 properties at a time");
        return prev;
      }
      return [...prev, property];
    });
  };

  const handleRemoveFromComparison = (id: string) => {
    setSelectedForComparison((prev) => prev.filter((p) => p.id !== id));
  };

  // Extract unique locations for filter
  const locations = useMemo(() => {
    const locs = new Set<string>();
    properties.forEach((p) => {
      const parts = p.location.split(",");
      if (parts.length > 1) {
        locs.add(parts[parts.length - 1].trim());
      } else {
        locs.add(p.location);
      }
    });
    return Array.from(locs).sort();
  }, [properties]);

  // Filter properties
  const filteredProperties = useMemo(() => {
    return properties.filter((p) => {
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        if (
          !p.title.toLowerCase().includes(searchLower) &&
          !p.location.toLowerCase().includes(searchLower)
        ) {
          return false;
        }
      }

      const priceMatch = p.price.match(/[\d.]+/);
      if (priceMatch) {
        const price = parseFloat(priceMatch[0]);
        if (price < filters.priceMin || price > filters.priceMax) {
          return false;
        }
      }

      if (p.beds < filters.bedsMin || p.beds > filters.bedsMax) {
        return false;
      }

      const sqftNum = parseInt(p.sqft.replace(/,/g, ''));
      if (sqftNum < filters.sqftMin || sqftNum > filters.sqftMax) {
        return false;
      }

      if (filters.location !== "all") {
        if (!p.location.toLowerCase().includes(filters.location.toLowerCase())) {
          return false;
        }
      }

      return true;
    });
  }, [properties, filters]);

  return (
    <>
      <section id="properties" className="py-20 md:py-28 relative overflow-hidden">
        {/* Light background with subtle parallax */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-b from-transparent via-secondary/30 to-transparent pointer-events-none"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1.5 }}
        />

        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent opacity-60 pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10">
          <ScrollReveal>
            <div className="text-center mb-12">
              <motion.div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
              >
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">Curated Collection</span>
              </motion.div>

              <h2 className="font-display text-3xl md:text-4xl lg:text-6xl font-bold mb-4">
                All Premium{" "}
                <span className="gradient-text">Properties</span>
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Explore our handpicked selection of premium properties in your
                preferred area
              </p>
            </div>
          </ScrollReveal>

          {/* Filters */}
          <ScrollReveal delay={0.2}>
            <PropertyFiltersComponent
              filters={filters}
              onFiltersChange={setFilters}
              locations={locations}
            />
          </ScrollReveal>

          {/* Comparison Bar */}
          {selectedForComparison.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-4 mb-6 flex items-center justify-between rounded-2xl"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <GitCompare className="w-5 h-5 text-primary" />
                </div>
                <span className="font-medium">
                  {selectedForComparison.length} properties selected for
                  comparison
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedForComparison([])}
                  className="rounded-xl"
                >
                  Clear
                </Button>
                <Button
                  size="sm"
                  onClick={() => setIsComparisonOpen(true)}
                  disabled={selectedForComparison.length < 2}
                  className="rounded-xl"
                >
                  Compare Now
                </Button>
              </div>
            </motion.div>
          )}

          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="w-10 h-10 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
          ) : filteredProperties.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <div className="w-20 h-20 mx-auto rounded-2xl bg-muted/50 flex items-center justify-center mb-6">
                <span className="text-3xl">🏠</span>
              </div>
              <p className="text-muted-foreground text-lg mb-4">
                No properties found matching your criteria
              </p>
              <Button
                variant="link"
                onClick={() =>
                  setFilters({
                    search: "",
                    priceMin: 0,
                    priceMax: 50,
                    bedsMin: 1,
                    bedsMax: 10,
                    sqftMin: 0,
                    sqftMax: 10000,
                    location: "all",
                  })
                }
                className="text-primary"
              >
                Clear all filters
              </Button>
            </motion.div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-6">
                Showing {filteredProperties.length} of {properties.length}{" "}
                properties
              </p>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                {filteredProperties.map((property, index) => (
                  <PropertyCard
                    key={property.id}
                    property={property}
                    index={index}
                    onViewDetails={handleViewDetails}
                    isSelected={selectedForComparison.some(
                      (p) => p.id === property.id
                    )}
                    onToggleSelect={handleToggleSelect}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      <PropertyDetailModal
        property={selectedProperty}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      <PropertyComparisonModal
        properties={selectedForComparison}
        isOpen={isComparisonOpen}
        onClose={() => setIsComparisonOpen(false)}
        onRemoveProperty={handleRemoveFromComparison}
      />
    </>
  );
};

export default PropertiesSection;
