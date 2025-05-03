import { useEffect, useState, useCallback } from "react";
import { Hash } from "viem";
import { Loader, Expand } from "lucide-react";
import { Card, CardContent } from "@/library/components/atoms/card";
import usePanderProtocol from "@/library/hooks/use-pander-protocol-new";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/library/components/atoms/dialog";
import { formatDistanceToNow } from "date-fns";
import EpochVisualization, { EpochDetail } from "@/library/components/atoms/epoch-visualization";

// Define epoch distribution percentages from contract
const EPOCH_DISTRIBUTIONS = [
  {
    number: 1,
    percentage: 36.57,
    distribution: 3657,
    color: "#7ccf00", // Medium Sea Green
    border: "#5ea500",
    message: "Early birds catch the fattest worms!",
    description: "Highest reward distribution - 36.57% of total tokens",
  },
  {
    number: 2,
    percentage: 27.43,
    distribution: 2743,
    color: "#2b7fff", // Dodger Blue
    border: "#155dfc",
    message: "Still early! Grab your share before it thins out!",
    description:
      "Second highest reward - 27.43% of total tokens (36.57% × 0.75)",
  },
  {
    number: 3,
    percentage: 20.58,
    distribution: 2058,
    color: "#ff6900", // Orange
    border: "#f54900",
    message: "The clock's ticking — stake while the rewards still shine!",
    description:
      "Third highest reward - 20.58% of total tokens (27.43% × 0.75)",
  },
  {
    number: 4,
    percentage: 15.42,
    distribution: 1542,
    color: "#fb2c36", // Orange Red
    border: "#e7000b",
    message: "Last call! Stake now before the gates close!",
    description: "Final epoch reward - 15.42% of total tokens (20.58% × 0.75)",
  },
];

interface EpochStatusProps {
  pollAddress: Hash;
}

const EpochStatus = ({ pollAddress }: EpochStatusProps) => {
  const [currentEpoch, setCurrentEpoch] = useState<number | null>(null);
  const [epochDetails, setEpochDetails] = useState<EpochDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [progress, setProgress] = useState(0); // 0-100 progress within current epoch
  const { getCurrentEpoch, getEpochInfo, poll, updateParams } = usePanderProtocol();

  // Update params to load poll data
  useEffect(() => {
    if (pollAddress) {
      updateParams({ pollAddress });
    }
  }, [pollAddress, updateParams]);

  // Calculate progress within current epoch
  const calculateProgress = useCallback(
    (epochNumber: number, startTime: number, endTime: number) => {
      const now = Date.now() / 1000;

      // Handle cases where epochs are complete or not started
      if (now < startTime) return 0;
      if (now > endTime) return 100;

      // Calculate progress within the epoch
      const epochDuration = endTime - startTime;
      const elapsedInEpoch = now - startTime;
      return Math.min(100, Math.max(0, (elapsedInEpoch / epochDuration) * 100));
    },
    []
  );

  // Calculate which epoch we're in based on time
  const calculateCurrentEpoch = useCallback(
    (startDate: number, endDate: number) => {
      const now = Date.now() / 1000;
      if (now < startDate / 1000) return 1;
      if (now >= endDate / 1000) return 4;

      const totalDuration = (endDate - startDate) / 1000;
      const epochDuration = totalDuration / 4;
      const elapsed = now - startDate / 1000;

      return Math.min(4, Math.max(1, Math.floor(elapsed / epochDuration) + 1));
    },
    []
  );

  // Calculate position offset for each epoch
  const calculatePositionOffset = useCallback(
    (epochNum: number) => {
      if (!poll.data || currentEpoch === null) return 0;

      const { startDate, endDate } = poll.data;
      const totalDuration = (endDate - startDate) / 1000;
      const epochDuration = totalDuration / 4;

      // Calculate start and end time for this epoch
      const epochStart = startDate / 1000 + (epochNum - 1) * epochDuration;
      const epochEnd = startDate / 1000 + epochNum * epochDuration;

      // If epoch is completed
      if (epochNum < currentEpoch) return 100;

      // If epoch is future
      if (epochNum > currentEpoch) return 0;

      // Current epoch - calculate progress
      return calculateProgress(epochNum, epochStart, epochEnd);
    },
    [poll.data, currentEpoch, calculateProgress]
  );

  // Load data
  useEffect(() => {
    const fetchEpochData = async () => {
      try {
        setIsLoading(true);

        if (!poll.data) {
          return; // Wait for poll data
        }

        const { startDate, endDate } = poll.data;

        // Get the current epoch from contract
        const contractEpoch = await getCurrentEpoch(pollAddress);
        const contractEpochNum = Number(contractEpoch);

        // Calculate which epoch we should be in based on time
        const expectedEpoch = calculateCurrentEpoch(startDate, endDate);
        setCurrentEpoch(expectedEpoch);

        // Get details for all epochs
        const totalDuration = (endDate - startDate) / 1000;
        const epochDuration = totalDuration / 4;

        const details = [];
        for (let i = 1; i <= 4; i++) {
          try {
            const info = await getEpochInfo(pollAddress, i);
            const epochData = {
              ...EPOCH_DISTRIBUTIONS[i - 1],
              ...info,
              isCurrent: i === expectedEpoch,
            };
            details.push(epochData);
          } catch (e) {
            // If we can't get info for future epochs, calculate times
            const epochStartTime = startDate / 1000 + (i - 1) * epochDuration;
            const epochEndTime = startDate / 1000 + i * epochDuration;

            details.push({
              ...EPOCH_DISTRIBUTIONS[i - 1],
              isCurrent: i === expectedEpoch,
              startTime: epochStartTime,
              endTime: epochEndTime,
              numStakers: 0,
              isDistributed: false,
            });
          }
        }
        setEpochDetails(details);
        setError(null);
      } catch (err) {
        console.error("Error fetching epoch data:", err);
        setError("Failed to fetch epoch data");
      } finally {
        setIsLoading(false);
      }
    };

    if (pollAddress && poll.data) {
      fetchEpochData();
    }
  }, [pollAddress, poll.data, getCurrentEpoch, getEpochInfo, calculateCurrentEpoch]);

  // Update progress frequently for smoother animation
  useEffect(() => {
    if (!isLoading && poll.data && currentEpoch !== null) {
      const { startDate, endDate } = poll.data;
      const totalDuration = (endDate - startDate) / 1000;
      const epochDuration = totalDuration / 4;

      // Calculate start and end time for current epoch
      const epochStart = startDate / 1000 + (currentEpoch - 1) * epochDuration;
      const epochEnd = startDate / 1000 + currentEpoch * epochDuration;

      const intervalId = setInterval(() => {
        // Calculate progress for current epoch
        const now = Date.now() / 1000;
        const newProgress = calculateProgress(currentEpoch, epochStart, epochEnd);
        setProgress(newProgress);

        // Check if we need to move to next epoch
        if (now > epochEnd && currentEpoch < 4) {
          setCurrentEpoch(currentEpoch + 1);
        }
      }, 100); // Update every 100ms for smoother animation

      return () => clearInterval(intervalId);
    }
  }, [isLoading, poll.data, currentEpoch, calculateProgress]);

  // Add debugging logs for epoch timing
  useEffect(() => {
    if (currentEpoch !== null && epochDetails.length > 0 && currentEpoch <= epochDetails.length) {
      const currentEpochDetails = epochDetails[currentEpoch - 1];
      if (currentEpochDetails && currentEpochDetails.endTime) {
        const endTime = new Date(Number(currentEpochDetails.endTime) * 1000);
        const now = new Date();
      }
    }
  }, [currentEpoch, progress, epochDetails]);

  // Get current epoch message
  const getCurrentEpochMessage = () => {
    if (currentEpoch === null || currentEpoch < 1 || currentEpoch > 4) {
      return "";
    }
    return EPOCH_DISTRIBUTIONS[currentEpoch - 1].message;
  };

  return (
    <>
      <Card className="mt-4">
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <span className="text-base font-medium text-gray-600">
                EPOCH Status
              </span>
            </div>
            {!isLoading && (
              <button
                className="p-1 rounded-full hover:bg-gray-100 transition-all"
                onClick={() => setDialogOpen(true)}
              >
                <Expand size={16} />
              </button>
            )}
          </div>

          <div className="text-3xl font-bold mb-4">
            {currentEpoch !== null ? currentEpoch : isLoading ? "-" : "0"}
          </div>

          {isLoading || !poll.data ? (
            <div className="flex justify-center items-center py-2">
              <Loader className="animate-spin text-gray-500 mr-2" size={16} />
              <span>Loading epoch data...</span>
            </div>
          ) : error ? (
            <div className="text-red-500 text-sm py-2">{error}</div>
          ) : (
            <EpochVisualization
              epochDetails={epochDetails}
              currentEpoch={currentEpoch}
              calculatePositionOffset={calculatePositionOffset}
            />
          )}

          {currentEpoch !== null && epochDetails.length > 0 && (
            <div className="space-y-1 mt-2">
              {currentEpoch > 0 && currentEpoch <= epochDetails.length && (
                <div className="text-xs text-slate-500">
                  <span>
                    {progress.toFixed(0)}% complete •{" "}
                    {(() => {
                      if (progress >= 100) {
                        return `epoch ${currentEpoch} complete`;
                      }
                      
                      if (poll.data) {
                        const { startDate, endDate } = poll.data;
                        const totalDuration = (endDate - startDate) / 1000; // in seconds
                        const epochDuration = totalDuration / 4; // each epoch duration in seconds
                        
                        // Calculate remaining time based on progress
                        const remainingTime = (epochDuration * (100 - progress)) / 100; // in seconds
                        const remainingMs = remainingTime * 1000;
                        
                        // Create a date that's remainingMs from now for formatDistanceToNow
                        const futureDate = new Date(Date.now() + remainingMs);
                        return formatDistanceToNow(futureDate, { addSuffix: false }) + ` in epoch ${currentEpoch} left`;
                      }
                      
                      // Fallback if we don't have poll data
                      return `epoch ${currentEpoch} in progress`;
                    })()}
                  </span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Epoch Breakdown Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[450px] border-border">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              Epoch Breakdown
            </DialogTitle>
          </DialogHeader>

          <div className="py-2">
            {/* Epoch visual status - using the shared component */}
            {epochDetails.length > 0 && (
              <EpochVisualization
                epochDetails={epochDetails}
                currentEpoch={currentEpoch}
                calculatePositionOffset={calculatePositionOffset}
              />
            )}

            {/* Detailed breakdown of each epoch */}
            <div className="space-y-3">
              {epochDetails.map((epoch) => (
                <div
                  key={`breakdown-${epoch.number}`}
                  className={`rounded-lg p-3 bg-white border border-gray-200 `}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium bg-gray-50 border-gray-200 border">
                      {epoch.number}
                    </div>

                    <div className="flex-1">
                      <h3 className="text-sm font-medium">
                        Epoch {epoch.number}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {epoch.description}
                      </p>
                    </div>

                    {/* Percentage badge */}
                    <div
                      className="text-xs px-2 py-1 rounded-full"
                      style={{
                        backgroundColor: `${epoch.color}15`,
                        color: epoch.color,
                      }}
                    >
                      {epoch.percentage}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-2 text-xs text-gray-500">
            <p>
              Reward distribution decreases by 25% each epoch, with the first
              epoch offering the highest reward percentage.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EpochStatus;
