import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface VideoData {
  file: File | null;
  url: string;
  selection: { x: number, y: number, width: number, height: number } | null;
}

interface AnalysisResults {
  alignment: number;
  timing: number;
  overall: number;
  feedback: string;
  tips: string[];
}

interface PoseComparisonContextType {
  userVideo: VideoData;
  referenceVideo: VideoData;
  analysisResults: AnalysisResults | null;
  isAnalyzing: boolean;
  analysisProgress: number;
  
  setUserVideo: (data: Partial<VideoData>) => void;
  setReferenceVideo: (data: Partial<VideoData>) => void;
  startAnalysis: () => void;
  setAnalysisResults: (results: AnalysisResults) => void;
  resetAll: () => void;
}

const defaultContext: PoseComparisonContextType = {
  userVideo: { file: null, url: '', selection: null },
  referenceVideo: { file: null, url: '', selection: null },
  analysisResults: null,
  isAnalyzing: false,
  analysisProgress: 0,
  
  setUserVideo: () => {},
  setReferenceVideo: () => {},
  startAnalysis: () => {},
  setAnalysisResults: () => {},
  resetAll: () => {}
};

const PoseComparisonContext = createContext<PoseComparisonContextType>(defaultContext);

export const usePoseComparison = () => useContext(PoseComparisonContext);

export const PoseComparisonProvider = ({ children }: { children: ReactNode }) => {
  const [userVideo, setUserVideoState] = useState<VideoData>({ file: null, url: '', selection: null });
  const [referenceVideo, setReferenceVideoState] = useState<VideoData>({ file: null, url: '', selection: null });
  const [analysisResults, setAnalysisResultsState] = useState<AnalysisResults | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);

  const setUserVideo = (data: Partial<VideoData>) => {
    if (userVideo.url && data.url && data.url !== userVideo.url) {
      URL.revokeObjectURL(userVideo.url);
    }
    setUserVideoState(prev => ({ ...prev, ...data }));
  };

  const setReferenceVideo = (data: Partial<VideoData>) => {
    if (referenceVideo.url && data.url && data.url !== referenceVideo.url) {
      URL.revokeObjectURL(referenceVideo.url);
    }
    setReferenceVideoState(prev => ({ ...prev, ...data }));
  };

  const startAnalysis = () => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    setAnalysisResultsState(null);
    
    // Simulate analysis progress
    const intervalId = setInterval(() => {
      setAnalysisProgress(prev => {
        if (prev >= 100) {
          clearInterval(intervalId);
          
          // Simulate analysis results after completion
          setTimeout(() => {
            setAnalysisResultsState({
              alignment: Math.floor(Math.random() * 15) + 75, // 75-90
              timing: Math.floor(Math.random() * 20) + 70, // 70-90
              overall: Math.floor(Math.random() * 15) + 75, // 75-90
              feedback: "Your technique shows good alignment in the upper body, but there's room for improvement in your lower body positioning. The timing of your movement follows the reference well in the initial phase but deviates slightly in the final position. Focus on maintaining proper form throughout the entire movement for better results.",
              tips: [
                "Focus on keeping your knees aligned with your toes during the movement",
                "Maintain a neutral spine position throughout the entire motion",
                "Practice the timing of the transition phase to match the reference"
              ]
            });
            setIsAnalyzing(false);
          }, 1000);
          
          return 100;
        }
        
        // Simulate different speeds of progress
        const increment = prev < 30 ? 3 : prev < 60 ? 1.5 : prev < 90 ? 0.8 : 0.5;
        return Math.min(prev + increment, 100);
      });
    }, 200);
    
    return () => clearInterval(intervalId);
  };

  const setAnalysisResults = (results: AnalysisResults) => {
    setAnalysisResultsState(results);
    setIsAnalyzing(false);
    setAnalysisProgress(100);
  };

  const resetAll = () => {
    if (userVideo.url) URL.revokeObjectURL(userVideo.url);
    if (referenceVideo.url) URL.revokeObjectURL(referenceVideo.url);
    
    setUserVideoState({ file: null, url: '', selection: null });
    setReferenceVideoState({ file: null, url: '', selection: null });
    setAnalysisResultsState(null);
    setIsAnalyzing(false);
    setAnalysisProgress(0);
  };

  useEffect(() => {
    return () => {
      if (userVideo.url) {
        URL.revokeObjectURL(userVideo.url);
      }
      if (referenceVideo.url) {
        URL.revokeObjectURL(referenceVideo.url);
      }
    };
  }, []);

  return (
    <PoseComparisonContext.Provider
      value={{
        userVideo,
        referenceVideo,
        analysisResults,
        isAnalyzing,
        analysisProgress,
        setUserVideo,
        setReferenceVideo,
        startAnalysis,
        setAnalysisResults,
        resetAll
      }}
    >
      {children}
    </PoseComparisonContext.Provider>
  );
};
