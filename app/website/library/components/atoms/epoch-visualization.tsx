import { Hash } from "viem";

// Define an interface for epoch detail items
export interface EpochDetail {
  number: number;
  percentage: number;
  distribution: number;
  color: string;
  border: string;
  message: string;
  description: string;
  startTime?: number;
  endTime?: number;
  numStakers?: number;
  isDistributed?: boolean;
  isCurrent?: boolean;
}

// Extracted component for epoch visualization
export interface EpochVisualizationProps {
  epochDetails: EpochDetail[];
  currentEpoch: number | null;
  calculatePositionOffset: (epochNum: number) => number;
}

const EpochVisualization = ({
  epochDetails,
  currentEpoch,
  calculatePositionOffset
}: EpochVisualizationProps) => {
  return (
    <div className="flex h-20 overflow-hidden rounded-lg gap-2 mb-6">
      {epochDetails.map((epoch, index) => (
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
            className="absolute left-0 top-0 bottom-0 z-10 bg-green-200"
            style={{
              width: `${calculatePositionOffset(epoch.number)}%`,
              transition: 'width 200ms linear', // Linear transition for smooth movement
              opacity:
                currentEpoch !== null &&
                  (epoch.number === currentEpoch || epoch.number < currentEpoch)
                  ? 0.5
                  : 0,
            }}
          />

          {/* Gradient indicator line at the end of progress */}
          {currentEpoch !== null &&
            epoch.number === currentEpoch &&
            calculatePositionOffset(epoch.number) > 0 && (
              <div
                className="absolute top-0 bottom-0 z-11 w-1 flex"
                style={{
                  left: `calc(${calculatePositionOffset(epoch.number)}% - 2px)`,
                  transition: 'left 200ms linear', // Linear transition for smooth movement
                }}
              >
                <div className="w-[1px] bg-gradient-to-t from-green-400 to-green-100" />
                <div className="w-[3px] bg-gradient-to-t from-green-400 to-green-50" />
              </div>
            )}

          {/* Text */}
          <div className="absolute inset-0 z-20 flex flex-col justify-center items-center">
            <div className="text-center flex items-center gap-1">
              <p
                className={`text-sm font-medium ${currentEpoch !== null && epoch.number === currentEpoch
                  ? "text-green-700"
                  : "text-gray-500"
                  }`}
              >
                epoch {epoch.number}
              </p>
              {currentEpoch !== null && epoch.number === currentEpoch && (
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
      ))}
    </div>
  );
};

export default EpochVisualization; 