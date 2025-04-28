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
  const [epochDetails, setEpochDetails] = useState<Array<any>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [progress, setProgress] = useState(0); // 0-100 progress within current epoch
  const { getCurrentEpoch, getEpochInfo } = usePanderProtocol();

  // Calculate progress within current epoch
  const calculateProgress = useCallback(
    (startTime: number, endTime: number) => {
      const now = Date.now() / 1000;
      if (now < startTime) return 0;
      if (now > endTime) return 100;

      const totalDuration = endTime - startTime;
      const elapsed = now - startTime;
      return Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
    },
    []
  );

  useEffect(() => {
    const fetchEpochData = async () => {
      try {
        setIsLoading(true);
        // Get the current epoch
        const epoch = await getCurrentEpoch(pollAddress);
        const currentEpochNum = Number(epoch);
        setCurrentEpoch(currentEpochNum);

        // Get details for all epochs
        const details = [];
        for (let i = 1; i <= 4; i++) {
          try {
            const info = await getEpochInfo(pollAddress, i);
            const epochData = {
              ...EPOCH_DISTRIBUTIONS[i - 1],
              ...info,
              isCurrent: i === currentEpochNum,
            };
            details.push(epochData);

            // Calculate progress for current epoch
            if (i === currentEpochNum) {
              const currentProgress = calculateProgress(
                info.startTime,
                info.endTime
              );
              setProgress(currentProgress);
            }
          } catch (e) {
            // If we can't get info for future epochs, use the distribution data we have
            details.push({
              ...EPOCH_DISTRIBUTIONS[i - 1],
              isCurrent: i === currentEpochNum,
              // Add placeholder timing data
              startTime: i === 1 ? Date.now() / 1000 - 86400 : 0,
              endTime: i === currentEpochNum ? Date.now() / 1000 + 86400 : 0,
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

    if (pollAddress) {
      fetchEpochData();
    }
  }, [pollAddress, getCurrentEpoch, getEpochInfo, calculateProgress]);

  // Update progress periodically
  useEffect(() => {
    if (!isLoading && currentEpoch !== null && epochDetails.length > 0) {
      const currentEpochData = epochDetails[currentEpoch - 1];
      if (currentEpochData) {
        const { startTime, endTime } = currentEpochData;

        const intervalId = setInterval(() => {
          const newProgress = calculateProgress(startTime, endTime);
          setProgress(newProgress);
        }, 15000); // Update every 15 seconds

        return () => clearInterval(intervalId);
      }
    }
  }, [isLoading, currentEpoch, epochDetails, calculateProgress]);

  // Calculate position offset for each epoch
  const calculatePositionOffset = (epochNum: number) => {
    if (currentEpoch === null) return 0;

    // If epoch is completed (previous epoch)
    if (epochNum < currentEpoch) return 100;

    // If epoch is future (beyond current)
    if (epochNum > currentEpoch) return 0;

    // Current epoch - use progress
    return progress;
  };

  // Get current epoch message
  const getCurrentEpochMessage = () => {
    if (currentEpoch === null || currentEpoch < 1 || currentEpoch > 4) {
      return "";
    }
    return EPOCH_DISTRIBUTIONS[currentEpoch - 1].message;
  };

  // Get the current epoch color and border
  const getCurrentEpochColor = () => {
    if (currentEpoch === null || currentEpoch < 1 || currentEpoch > 4) {
      return { color: "#e2e8f0", border: "#cbd5e1" };
    }
    const currentEpochData = EPOCH_DISTRIBUTIONS[currentEpoch - 1];
    return {
      color: currentEpochData.color,
      border: currentEpochData.border,
    };
  };

  // Get current epoch data
  const currentEpochData =
    currentEpoch !== null && epochDetails.length > 0
      ? epochDetails[currentEpoch - 1]
      : null;

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

          {isLoading ? (
            <div className="flex justify-center items-center py-2">
              <Loader className="animate-spin text-gray-500 mr-2" size={16} />
              <span>Loading epoch data...</span>
            </div>
          ) : error ? (
            <div className="text-red-500 text-sm py-2">{error}</div>
          ) : (
            <div className="flex h-20 overflow-hidden rounded-lg gap-2 mb-6">
              {epochDetails.map((epoch, index) => {
                return (
                  <div
                    key={`epoch-${epoch.number}`}
                    className={`relative h-full ${index === 0 ? "rounded-l-lg" : ""
                      } ${index === epochDetails.length - 1 ? "rounded-r-lg" : ""
                      } overflow-hidden bg-slate-50 border border-slate-100`}
                    style={{
                      width: `${epoch.percentage}%`,
                    }}
                  >
                    {/* Main progress background in green */}
                    <div
                      className="absolute left-0 top-0 bottom-0 z-10 transition-all duration-1000 bg-green-200"
                      style={{
                        width: `${calculatePositionOffset(epoch.number)}%`,
                        opacity:
                          currentEpoch !== null &&
                            (epoch.number === currentEpoch ||
                              epoch.number < currentEpoch)
                            ? 0.5
                            : 0,
                      }}
                    />

                    {/* Gradient indicator line at the end of progress */}
                    {currentEpoch !== null &&
                      epoch.number === currentEpoch &&
                      calculatePositionOffset(epoch.number) > 0 && (
                        <div
                          className="absolute top-0 bottom-0 z-11 w-1 flex "
                          style={{
                            left: `calc(${calculatePositionOffset(
                              epoch.number
                            )}% - 2px)`,
                          }}
                        >
                          <div className="w-[1px] bg-gradient-to-t from-green-400 to-green-100 " />
                          <div className="w-[3px] bg-gradient-to-t from-green-400 to-green-50" />
                        </div>
                      )}

                    {/* Text */}
                    <div className="absolute inset-0 z-20 flex flex-col justify-center items-center">
                      <div className="text-center flex items-center gap-1">
                        <p
                          className={`text-sm font-medium ${currentEpoch !== null &&
                            epoch.number === currentEpoch
                            ? "text-green-700"
                            : "text-gray-500"
                            }`}
                        >
                          epoch {epoch.number}
                        </p>
                        {currentEpoch !== null &&
                          epoch.number === currentEpoch && (
                            <span className="flex items-center justify-center mt-1 text-green-700">
                              <svg
                                width="10"
                                height="10"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M20 6L9 17L4 12"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </span>
                          )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {currentEpoch !== null && epochDetails.length > 0 && (
            <div className="space-y-1 mt-2">
              {epochDetails[currentEpoch - 1] && (
                <div className="text-xs text-slate-500">
                  <span>
                    {progress.toFixed(0)}% complete •{" "}
                    {progress < 100
                      ? formatDistanceToNow(
                        new Date(
                          epochDetails[currentEpoch - 1].endTime * 1000
                        ),
                        { addSuffix: false }
                      ) + ` in epoch ${currentEpoch} left`
                      : `epoch ${currentEpoch} complete`}
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
            {/* Epoch visual status - same as main card */}
            <div className="flex h-20 overflow-hidden rounded-lg gap-2 mb-6">
              {epochDetails.map((epoch, index) => {
                return (
                  <div
                    key={`epoch-${epoch.number}`}
                    className={`relative h-full ${index === 0 ? "rounded-l-lg" : ""
                      } ${index === epochDetails.length - 1 ? "rounded-r-lg" : ""
                      } overflow-hidden bg-slate-50 border border-slate-100`}
                    style={{
                      width: `${epoch.percentage}%`,
                    }}
                  >
                    {/* Main progress background in green */}
                    <div
                      className="absolute left-0 top-0 bottom-0 z-10 transition-all duration-1000 bg-green-200"
                      style={{
                        width: `${calculatePositionOffset(epoch.number)}%`,
                        opacity:
                          currentEpoch !== null &&
                            (epoch.number === currentEpoch ||
                              epoch.number < currentEpoch)
                            ? 0.5
                            : 0,
                      }}
                    />

                    {/* Gradient indicator line at the end of progress */}
                    {currentEpoch !== null &&
                      epoch.number === currentEpoch &&
                      calculatePositionOffset(epoch.number) > 0 && (
                        <div
                          className="absolute top-0 bottom-0 z-11 w-1 flex "
                          style={{
                            left: `calc(${calculatePositionOffset(
                              epoch.number
                            )}% - 2px)`,
                          }}
                        >
                          <div className="w-[1px] bg-gradient-to-t from-green-400 to-green-100 " />
                          <div className="w-[3px] bg-gradient-to-t from-green-400 to-green-50" />
                        </div>
                      )}

                    {/* Text */}
                    <div className="absolute inset-0 z-20 flex flex-col justify-center items-center">
                      <div className="text-center flex items-center gap-1">
                        <p
                          className={`text-sm font-medium ${currentEpoch !== null &&
                            epoch.number === currentEpoch
                            ? "text-green-700"
                            : "text-gray-500"
                            }`}
                        >
                          epoch {epoch.number}
                        </p>
                        {currentEpoch !== null &&
                          epoch.number === currentEpoch && (
                            <span className="flex items-center justify-center mt-1 text-green-700">
                              <svg
                                width="10"
                                height="10"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M20 6L9 17L4 12"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </span>
                          )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
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
