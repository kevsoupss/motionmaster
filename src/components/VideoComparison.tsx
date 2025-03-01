import { Card } from "@/components/ui/card";
import React, { useState } from 'react';
import { BoundingBoxSelector } from './BoundingBoxSelector';
import { VideoUpload } from './VideoUpload';

interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const VideoComparison: React.FC = () => {
  const [userVideo, setUserVideo] = useState<string | null>(null);
  const [referenceVideo, setReferenceVideo] = useState<string | null>(null);
  const [userBoundingBox, setUserBoundingBox] = useState<BoundingBox | null>(null);
  const [referenceBoundingBox, setReferenceBoundingBox] = useState<BoundingBox | null>(null);
  const [step, setStep] = useState<'upload-user' | 'select-user' | 'upload-reference' | 'select-reference' | 'processing' | 'results'>('upload-user');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleUserVideoSelect = (file: File) => {
    const url = URL.createObjectURL(file);
    setUserVideo(url);
    setStep('select-user');
  };

  const handleReferenceVideoSelect = (file: File) => {
    const url = URL.createObjectURL(file);
    setReferenceVideo(url);
    setStep('select-reference');
  };

  const handleUserBoundingBoxSelect = (box: BoundingBox) => {
    setUserBoundingBox(box);
    setStep('upload-reference');
  };

  const handleReferenceBoundingBoxSelect = (box: BoundingBox) => {
    setReferenceBoundingBox(box);
    setStep('processing');
    processVideos();
  };

  const processVideos = async () => {
    setIsProcessing(true);
    // TODO: Implement video processing with pose estimation
    // This is where we'll add the deep learning model integration
    setIsProcessing(false);
    setStep('results');
  };

  const renderStep = () => {
    switch (step) {
      case 'upload-user':
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Upload Your Video</h2>
            <p className="text-gray-600">Upload a video of yourself performing the technique</p>
            <VideoUpload onVideoSelect={handleUserVideoSelect} />
          </div>
        );

      case 'select-user':
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Select Yourself in the Video</h2>
            <p className="text-gray-600">Draw a box around yourself in the video</p>
            {userVideo && (
              <BoundingBoxSelector
                videoSrc={userVideo}
                onBoundingBoxSelect={handleUserBoundingBoxSelect}
              />
            )}
          </div>
        );

      case 'upload-reference':
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Upload Reference Video</h2>
            <p className="text-gray-600">Upload a video of the athlete performing the technique</p>
            <VideoUpload onVideoSelect={handleReferenceVideoSelect} />
          </div>
        );

      case 'select-reference':
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Select Athlete in the Video</h2>
            <p className="text-gray-600">Draw a box around the athlete in the video</p>
            {referenceVideo && (
              <BoundingBoxSelector
                videoSrc={referenceVideo}
                onBoundingBoxSelect={handleReferenceBoundingBoxSelect}
              />
            )}
          </div>
        );

      case 'processing':
        return (
          <div className="space-y-4 text-center">
            <h2 className="text-2xl font-bold">Processing Videos</h2>
            <p className="text-gray-600">Please wait while we analyze the videos...</p>
            {/* Add loading spinner here */}
          </div>
        );

      case 'results':
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Results</h2>
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-2">Your Video</h3>
                {userVideo && (
                  <video src={userVideo} controls className="w-full rounded-lg" />
                )}
              </Card>
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-2">Reference Video</h3>
                {referenceVideo && (
                  <video src={referenceVideo} controls className="w-full rounded-lg" />
                )}
              </Card>
            </div>
            {/* TODO: Add comparison results and feedback here */}
          </div>
        );
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        {renderStep()}
      </div>
    </div>
  );
}; 