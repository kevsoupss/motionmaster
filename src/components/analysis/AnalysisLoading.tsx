
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Cpu } from "lucide-react";

interface AnalysisLoadingProps {
  progress?: number;
  stage?: string;
}

const AnalysisLoading = ({ progress = 0, stage = "Initializing" }: AnalysisLoadingProps) => {
  const stages = [
    "Initializing AI model",
    "Processing your video",
    "Detecting poses",
    "Processing reference video",
    "Comparing techniques",
    "Generating insights",
    "Finalizing analysis"
  ];
  
  const currentStageIndex = Math.min(
    Math.floor((progress / 100) * stages.length),
    stages.length - 1
  );
  
  const currentStage = stage || stages[currentStageIndex];
  
  return (
    <Card className="p-8 max-w-xl mx-auto">
      <div className="text-center space-y-6">
        <motion.div
          animate={{ scale: [0.9, 1.1, 0.9] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center"
        >
          <Cpu className="h-10 w-10 text-primary" />
        </motion.div>
        
        <div>
          <h2 className="text-xl font-medium mb-2">Analyzing Your Performance</h2>
          <p className="text-muted-foreground">
            Our AI is processing your videos and comparing the techniques. This might take a moment.
          </p>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>{currentStage}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
        
        <div className="pt-2">
          <p className="text-sm text-muted-foreground italic">
            Pose estimation and comparative analysis use advanced AI algorithms that require significant processing power.
          </p>
        </div>
      </div>
    </Card>
  );
};

export default AnalysisLoading;
