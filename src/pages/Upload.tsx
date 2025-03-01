import PageContainer from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import BoundingBoxSelector from "@/components/video/BoundingBoxSelector";
import VideoUpload from "@/components/video/VideoUpload";
import VideoPlayer from "@/components/video/VideoPlayer";
import { usePoseComparison } from "@/context/PoseComparisonContext";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { ref, uploadString } from 'firebase/storage';
import { storage } from "@/lib/firebase";

const Upload = () => {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const {
    userVideo,
    referenceVideo,
    setUserVideo,
    setReferenceVideo
  } = usePoseComparison();

  const saveSelectionsToFirebase = async () => {
    if (!currentUser || !userVideo.selection || !referenceVideo.selection) {
      console.log('❌ Storage skipped: Missing user or selections');
      return;
    }

    try {
      // Get a fresh token before saving
      const token = await currentUser.getIdToken(true);
      console.log('🔑 Got fresh token:', token.substring(0, 10) + '...');

      console.log('🔄 Preparing data for storage...');
      const dataToSave = {
        userId: currentUser.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userVideo: {
          ...userVideo.selection,
          videoUrl: userVideo.url,
          timestamp: Date.now()
        },
        referenceVideo: {
          ...referenceVideo.selection,
          videoUrl: referenceVideo.url,
          timestamp: Date.now()
        }
      };
      
      console.log('📦 Data to save:', dataToSave);
      
      // Create a unique path for this selection pair
      const timestamp = Date.now();
      const path = `selections/${currentUser.uid}/comparison_${timestamp}.json`;
      console.log('🎯 Storage path:', path);
      
      // Create a reference to the file location
      const storageRef = ref(storage, path);

      // Convert data to JSON string and save
      console.log('💾 Saving to Storage...');
      const jsonData = JSON.stringify(dataToSave, null, 2);
      await uploadString(storageRef, jsonData, 'raw', {
        contentType: 'application/json',
        customMetadata: {
          userId: currentUser.uid,
          timestamp: timestamp.toString(),
          isComplete: 'true'
        }
      });

      console.log('✅ Successfully saved to Storage!');
      console.log('🗄️ Full path:', path);
      
      toast({
        title: "Selections saved",
        description: "Both video selections have been saved successfully.",
      });
    } catch (error: any) {
      console.error('❌ Error saving to Storage:', error);
      toast({
        title: "Error",
        description: `Failed to save selections: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const handleUserVideoSelected = (file: File, url: string) => {
    setUserVideo({ file, url });
    setStep(2);
  };

  const handleReferenceVideoSelected = (file: File, url: string) => {
    setReferenceVideo({ file, url });
    setStep(4);
  };

  const handleUserSelectionComplete = (selection: { x: number, y: number, width: number, height: number, videoUrl: string }) => {
    console.log('🎯 User selection complete handler called:', selection);
    
    // Update state and step in a single batch
    setUserVideo({
      ...userVideo,
      selection
    });
    console.log('📝 Setting step to 3');
    setStep(3);
    console.log('✅ Step should now be 3');
  };

  const handleReferenceSelectionComplete = (selection: { x: number, y: number, width: number, height: number, videoUrl: string }) => {
    console.log('🎯 Reference selection complete handler called:', selection);
    
    // Update state and step in a single batch
    setReferenceVideo({
      ...referenceVideo,
      selection
    });
    console.log('📝 Setting step to 5');
    setStep(5);
    console.log('✅ Step should now be 5');
    
    // Save both selections after step 5
    saveSelectionsToFirebase();
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
                <div className="rounded-lg border bg-card">
                  <div className="aspect-video">
                    {userVideo.url && (
                      <VideoPlayer
                        src={userVideo.url}
                        className="w-full h-full object-contain"
                      />
                    )}
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium">Reference Performance</p>
                <div className="rounded-lg border bg-card">
                  <div className="aspect-video">
                    {referenceVideo.url && (
                      <VideoPlayer
                        src={referenceVideo.url}
                        className="w-full h-full object-contain"
                      />
                    )}
                  </div>
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
