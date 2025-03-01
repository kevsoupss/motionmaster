
import { useEffect, useState } from "react";
import PageContainer from "@/components/layout/PageContainer";
import ComparisonViewer from "@/components/analysis/ComparisonViewer";
import AnalysisLoading from "@/components/analysis/AnalysisLoading";
import { usePoseComparison } from "@/context/PoseComparisonContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { motion } from "framer-motion";

const Analysis = () => {
  const navigate = useNavigate();
  const {
    userVideo,
    referenceVideo,
    analysisResults,
    isAnalyzing,
    analysisProgress,
    startAnalysis,
  } = usePoseComparison();
  
  const [fullscreenMode, setFullscreenMode] = useState(false);
  
  // Check if we have the required data, if not, redirect to upload
  useEffect(() => {
    if (!userVideo.url || !referenceVideo.url) {
      navigate("/upload");
      return;
    }
    
    // Start analysis if it hasn't been started yet
    if (!isAnalyzing && !analysisResults) {
      startAnalysis();
    }
  }, [userVideo.url, referenceVideo.url, isAnalyzing, analysisResults, navigate, startAnalysis]);
  
  const handleSaveProgress = async () => {
    // This is a placeholder for saving progress functionality
    // In a real application, this would save to a database
    console.log("Saving progress...");
    
    // Simulate saving delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return true;
  };
  
  const toggleFullscreen = () => {
    setFullscreenMode(!fullscreenMode);
  };
  
  if (!userVideo.url || !referenceVideo.url) {
    return null; // Redirect will happen in useEffect
  }
  
  return (
    <PageContainer 
      showBackButton={true} 
      showSaveButton={!isAnalyzing && !!analysisResults}
      title="Analysis Results"
      onSave={handleSaveProgress}
      fullWidth={false}
    >
      {isAnalyzing ? (
        <AnalysisLoading progress={analysisProgress} />
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <ComparisonViewer
            userVideoUrl={userVideo.url}
            referenceVideoUrl={referenceVideo.url}
            analysisResults={analysisResults}
            onFullscreenRequest={toggleFullscreen}
          />
          
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <motion.div
              className="col-span-full lg:col-span-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h2 className="text-2xl font-semibold mb-4">What's Next?</h2>
              <div className="prose prose-sm max-w-none">
                <p>
                  Now that you've received feedback on your technique, here are some steps you can take:
                </p>
                <ul>
                  <li>Review the side-by-side comparison to visually identify differences</li>
                  <li>Practice implementing the suggested improvements in your technique</li>
                  <li>Record a new performance after practice and run another analysis</li>
                  <li>Track your progress over time to see how you're improving</li>
                </ul>
                <p>
                  Remember that developing perfect technique takes time and consistent practice. 
                  Use this analysis as a guide, but also listen to your body and work with 
                  professional coaches when possible.
                </p>
              </div>
              
              <div className="mt-6 flex gap-4">
                <Button onClick={() => navigate("/upload")}>
                  New Analysis
                </Button>
                <Button variant="outline" onClick={() => navigate("/")}>
                  Back to Home
                </Button>
              </div>
            </motion.div>
            
            <motion.div
              className="col-span-full lg:col-span-1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <h2 className="text-2xl font-semibold mb-4">Resources</h2>
              <div className="bg-muted rounded-lg p-4 space-y-4">
                <div className="group">
                  <h3 className="font-medium mb-1 group-hover:text-primary transition-colors">Training Programs</h3>
                  <p className="text-sm text-muted-foreground">Access structured programs to improve your technique</p>
                </div>
                <div className="group">
                  <h3 className="font-medium mb-1 group-hover:text-primary transition-colors">Professional Coaching</h3>
                  <p className="text-sm text-muted-foreground">Connect with coaches who can provide personalized guidance</p>
                </div>
                <div className="group">
                  <h3 className="font-medium mb-1 group-hover:text-primary transition-colors">Performance Analytics</h3>
                  <p className="text-sm text-muted-foreground">Track your progress and improvements over time</p>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
      
      <Dialog open={fullscreenMode} onOpenChange={setFullscreenMode}>
        <DialogContent className="max-w-7xl w-[calc(100%-2rem)] p-0">
          <div className="h-[calc(100vh-6rem)]">
            <ComparisonViewer
              userVideoUrl={userVideo.url}
              referenceVideoUrl={referenceVideo.url}
              analysisResults={analysisResults}
            />
          </div>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
};

export default Analysis;
