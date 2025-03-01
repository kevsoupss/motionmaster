
import { useState } from "react";
import { Button } from "@/components/ui/button";
import PageContainer from "@/components/layout/PageContainer";
import VideoUpload from "@/components/video/VideoUpload";
import BoundingBoxSelector from "@/components/video/BoundingBoxSelector";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { usePoseComparison } from "@/context/PoseComparisonContext";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const Upload = () => {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();
  const {
    userVideo,
    referenceVideo,
    setUserVideo,
    setReferenceVideo
  } = usePoseComparison();

  const handleUserVideoSelected = (file: File, url: string) => {
    setUserVideo({ file, url });
  };

  const handleReferenceVideoSelected = (file: File, url: string) => {
    setReferenceVideo({ file, url });
  };

  const handleUserSelectionComplete = (selection: { x: number, y: number, width: number, height: number }) => {
    setUserVideo({ selection });
    setStep(3);
  };

  const handleReferenceSelectionComplete = (selection: { x: number, y: number, width: number, height: number }) => {
    setReferenceVideo({ selection });
    setStep(5);
  };

  const goToAnalysis = () => {
    navigate("/analysis");
  };

  const canProceedToStep2 = !!userVideo.url;
  const canProceedToStep4 = !!referenceVideo.url;
  const canProceedToAnalysis = !!userVideo.selection && !!referenceVideo.selection;

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-2xl font-semibold mb-2">Upload Your Performance</h2>
            <p className="text-muted-foreground mb-6">
              Record or upload a video of yourself performing the technique you want to analyze
            </p>
            <VideoUpload
              onVideoSelected={handleUserVideoSelected}
              label="Your Performance Video"
              allowCamera={true}
            />
            <div className="mt-6 flex justify-end">
              <Button 
                onClick={() => setStep(2)} 
                disabled={!canProceedToStep2}
                className="flex items-center gap-2"
              >
                Next Step
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        );
        
      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-2xl font-semibold mb-2">Select Yourself in the Video</h2>
            <p className="text-muted-foreground mb-6">
              Draw a box around yourself to help our AI focus on your movements
            </p>
            <BoundingBoxSelector
              videoUrl={userVideo.url}
              onSelectionComplete={handleUserSelectionComplete}
            />
            <div className="mt-6 flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => setStep(1)}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
            </div>
          </motion.div>
        );
        
      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-2xl font-semibold mb-2">Upload Reference Performance</h2>
            <p className="text-muted-foreground mb-6">
              Upload a video of the professional athlete or reference technique
            </p>
            <VideoUpload
              onVideoSelected={handleReferenceVideoSelected}
              label="Reference Performance Video"
              allowCamera={false}
            />
            <div className="mt-6 flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => setStep(2)}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
              <Button 
                onClick={() => setStep(4)} 
                disabled={!canProceedToStep4}
                className="flex items-center gap-2"
              >
                Next Step
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        );
        
      case 4:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-2xl font-semibold mb-2">Select the Athlete in Reference Video</h2>
            <p className="text-muted-foreground mb-6">
              Draw a box around the athlete to help our AI focus on their movements
            </p>
            <BoundingBoxSelector
              videoUrl={referenceVideo.url}
              onSelectionComplete={handleReferenceSelectionComplete}
            />
            <div className="mt-6 flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => setStep(3)}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
            </div>
          </motion.div>
        );
        
      case 5:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-2xl font-semibold mb-2">Ready for Analysis</h2>
            <p className="text-muted-foreground mb-6">
              Your videos have been prepared. Click below to start the analysis process.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <p className="text-sm font-medium">Your Performance</p>
                <div className="aspect-video bg-muted rounded-lg overflow-hidden border">
                  {userVideo.url && (
                    <video 
                      src={userVideo.url} 
                      controls 
                      className="w-full h-full object-contain" 
                    />
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium">Reference Performance</p>
                <div className="aspect-video bg-muted rounded-lg overflow-hidden border">
                  {referenceVideo.url && (
                    <video 
                      src={referenceVideo.url} 
                      controls 
                      className="w-full h-full object-contain" 
                    />
                  )}
                </div>
              </div>
            </div>
            
            <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Our AI will now analyze both videos and provide detailed feedback on your technique
              </p>
              <Button 
                size="lg"
                onClick={goToAnalysis}
                disabled={!canProceedToAnalysis}
                className="px-8"
              >
                Start Analysis
              </Button>
            </div>
            
            <div className="mt-6 flex justify-start">
              <Button 
                variant="outline" 
                onClick={() => setStep(4)}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
            </div>
          </motion.div>
        );
        
      default:
        return null;
    }
  };

  return (
    <PageContainer showBackButton={true} title="Upload Videos">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                1
              </div>
              <div className={`h-1 w-16 ${step >= 2 ? 'bg-primary' : 'bg-muted'}`}></div>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                2
              </div>
              <div className={`h-1 w-16 ${step >= 3 ? 'bg-primary' : 'bg-muted'}`}></div>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                3
              </div>
              <div className={`h-1 w-16 ${step >= 4 ? 'bg-primary' : 'bg-muted'}`}></div>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 4 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                4
              </div>
              <div className={`h-1 w-16 ${step >= 5 ? 'bg-primary' : 'bg-muted'}`}></div>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 5 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                5
              </div>
            </div>
          </div>
        </div>
        
        {renderStep()}
      </div>
    </PageContainer>
  );
};

export default Upload;
