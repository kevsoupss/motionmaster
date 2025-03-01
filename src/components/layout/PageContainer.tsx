
import { ReactNode } from "react";
import { motion } from "framer-motion";
import Header from "./Header";

interface PageContainerProps {
  children: ReactNode;
  showBackButton?: boolean;
  showSaveButton?: boolean;
  title?: string;
  onSave?: () => void;
  fullWidth?: boolean;
}

const PageContainer = ({ 
  children, 
  showBackButton = false, 
  showSaveButton = false, 
  title,
  onSave,
  fullWidth = false
}: PageContainerProps) => {
  return (
    <div className="min-h-screen bg-background">
      <Header 
        showBackButton={showBackButton} 
        showSaveButton={showSaveButton} 
        title={title}
        onSave={onSave}
      />
      <motion.main 
        className={`pt-16 pb-8 ${fullWidth ? 'px-0' : 'container mx-auto px-4 md:px-6'}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        {children}
      </motion.main>
    </div>
  );
};

export default PageContainer;
