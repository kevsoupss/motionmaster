
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft, Save } from "lucide-react";

interface HeaderProps {
  showBackButton?: boolean;
  showSaveButton?: boolean;
  title?: string;
  onSave?: () => void;
}

const Header = ({ 
  showBackButton = false, 
  showSaveButton = false, 
  title = "Pose Matchup Mentor", 
  onSave 
}: HeaderProps) => {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (onSave) {
      setSaving(true);
      await onSave();
      setSaving(false);
    }
  };

  return (
    <motion.header 
      className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {showBackButton && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate(-1)} 
              className="mr-2"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          )}
          <h1 className="text-xl font-medium">{title}</h1>
        </div>
        {showSaveButton && (
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="relative overflow-hidden"
          >
            <span className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save Progress'}
            </span>
            {saving && (
              <span className="absolute inset-0 bg-primary/10 animate-shimmer"></span>
            )}
          </Button>
        )}
      </div>
    </motion.header>
  );
};

export default Header;
