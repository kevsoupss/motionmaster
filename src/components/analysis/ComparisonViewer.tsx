import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { ArrowRight, Maximize2, Play, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import VideoPlayer from "@/components/video/VideoPlayer";

interface ComparisonViewerProps {
  userVideoUrl: string;
  referenceVideoUrl: string;
  analysisResults?: any;
  onFullscreenRequest?: () => void;
}

const ComparisonViewer = ({ 
  userVideoUrl, 
  referenceVideoUrl, 
  analysisResults,
  onFullscreenRequest
}: ComparisonViewerProps) => {
  const [tab, setTab] = useState("side-by-side");
  const [syncedPlayback, setSyncedPlayback] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [userVideo, setUserVideo] = useState<HTMLVideoElement | null>(null);
  const [referenceVideo, setReferenceVideo] = useState<HTMLVideoElement | null>(null);

  useEffect(() => {
    const userVid = document.getElementById("user-video") as HTMLVideoElement;
    const refVid = document.getElementById("reference-video") as HTMLVideoElement;
    
    if (userVid && refVid) {
      setUserVideo(userVid);
      setReferenceVideo(refVid);
      
      userVid.onplay = () => {
        setIsPlaying(true);
        if (syncedPlayback && refVid.paused) {
          refVid.play();
        }
      };
      
      userVid.onpause = () => {
        setIsPlaying(false);
        if (syncedPlayback && !refVid.paused) {
          refVid.pause();
        }
      };
      
      refVid.onplay = () => {
        if (syncedPlayback && userVid.paused) {
          userVid.play();
        }
      };
      
      refVid.onpause = () => {
        if (syncedPlayback && !userVid.paused) {
          userVid.pause();
        }
      };
    }
    
    return () => {
      if (userVid) {
        userVid.onplay = null;
        userVid.onpause = null;
      }
      if (refVid) {
        refVid.onplay = null;
        refVid.onpause = null;
      }
    };
  }, [syncedPlayback]);

  const toggleSyncedPlayback = () => {
    setSyncedPlayback(!syncedPlayback);
  };

  const togglePlayPause = () => {
    if (userVideo && referenceVideo) {
      if (isPlaying) {
        userVideo.pause();
        referenceVideo.pause();
      } else {
        userVideo.play();
        referenceVideo.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <Card className="overflow-hidden bg-background">
      <div className="p-4 flex items-center justify-between border-b">
        <div>
          <h3 className="font-medium text-lg">Video Comparison</h3>
          <p className="text-sm text-muted-foreground">
            Compare your technique with the reference
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={togglePlayPause}
          >
            <Play className={`h-5 w-5 ${isPlaying ? 'text-primary' : ''}`} />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={toggleSyncedPlayback}
          >
            <ArrowRight className={`h-5 w-5 ${syncedPlayback ? 'text-primary' : ''}`} />
          </Button>
          {onFullscreenRequest && (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onFullscreenRequest}
            >
              <Maximize2 className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
      
      <Tabs defaultValue="side-by-side" className="w-full" onValueChange={setTab}>
        <div className="border-b px-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="side-by-side">Side by Side</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="side-by-side" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-4 max-w-[1200px] mx-auto">
            <div className="space-y-2">
              <p className="text-sm font-medium">Your Performance</p>
              <div className="rounded-lg border bg-card">
                <div className="aspect-video">
                  <VideoPlayer
                    id="user-video"
                    src={userVideoUrl}
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium">Reference Performance</p>
              <div className="rounded-lg border bg-card">
                <div className="aspect-video">
                  <VideoPlayer
                    id="reference-video"
                    src={referenceVideoUrl}
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="analysis" className="mt-0">
          <div className="p-4 space-y-6">
            {analysisResults ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Card className="p-4 bg-card hover-scale">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium">Posture Alignment</h4>
                      <BarChart3 className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex items-end gap-4 pt-2">
                      <div className="text-3xl font-bold">{analysisResults.alignment || "85"}%</div>
                      <div className="text-sm text-muted-foreground">match accuracy</div>
                    </div>
                  </Card>
                  
                  <Card className="p-4 bg-card hover-scale">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium">Movement Timing</h4>
                      <BarChart3 className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex items-end gap-4 pt-2">
                      <div className="text-3xl font-bold">{analysisResults.timing || "78"}%</div>
                      <div className="text-sm text-muted-foreground">synchronization</div>
                    </div>
                  </Card>
                  
                  <Card className="p-4 bg-card hover-scale">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium">Overall Score</h4>
                      <BarChart3 className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex items-end gap-4 pt-2">
                      <div className="text-3xl font-bold">{analysisResults.overall || "82"}%</div>
                      <div className="text-sm text-muted-foreground">technique match</div>
                    </div>
                  </Card>
                </div>
                
                <div className="mt-8 space-y-4">
                  <h4 className="font-medium text-lg">Detailed Analysis</h4>
                  <p className="text-muted-foreground">
                    {analysisResults.feedback || 
                      "Your technique shows good alignment in the upper body, but there's room for improvement in your lower body positioning. The timing of your movement follows the reference well in the initial phase but deviates slightly in the final position. Focus on maintaining proper form throughout the entire movement for better results."}
                  </p>
                  
                  <Separator className="my-4" />
                  
                  <h4 className="font-medium text-lg">Improvement Tips</h4>
                  <ul className="space-y-2">
                    {(analysisResults.tips || [
                      "Focus on keeping your knees aligned with your toes during the movement",
                      "Maintain a neutral spine position throughout the entire motion",
                      "Practice the timing of the transition phase to match the reference"
                    ]).map((tip, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-primary/10 text-primary text-xs mt-0.5">
                          {index + 1}
                        </span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ) : (
              <div className="py-12 text-center">
                <div className="inline-block p-3 rounded-full bg-primary/10 mb-4">
                  <BarChart3 className="h-6 w-6 text-primary animate-pulse" />
                </div>
                <h3 className="text-lg font-medium mb-2">Analysis in Progress</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Our AI is comparing your technique with the reference performance. This may take a few moments.
                </p>
                <div className="w-48 h-1 bg-muted rounded-full overflow-hidden mx-auto mt-6">
                  <div className="h-full bg-primary animate-shimmer"></div>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
};

export default ComparisonViewer;
