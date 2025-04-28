import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowDown, Info } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useAccount } from "wagmi";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { readContract } from "@wagmi/core";
import { erc20Abi } from "viem";

import { Button } from "@/library/components/atoms/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/library/components/atoms/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/library/components/atoms/drawer";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/library/components/atoms/form";
import { Input } from "@/library/components/atoms/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/library/components/atoms/select";
import { Textarea } from "@/library/components/atoms/text-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/library/components/atoms/tooltip";
import useCapyProtocol from "@/library/hooks/use-capy-protocol-new";
import { useMediaQuery } from "@/library/hooks/use-media-query";
import { useMounted } from "@/library/hooks/use-mounted";
import { config } from "@/library/providers/wagmi/config";

const FormSchema = z.object({
  question: z.string().min(1, { message: "Question is required" }),
  avatar: z.string(),
  rule: z.string(),
  durationValue: z
    .number()
    .min(1, { message: "Duration must be greater than 0" }),
  durationUnit: z.enum(["seconds", "minutes", "hours", "days", "weeks"]),
  yesTokenName: z.string().min(1, { message: "Yes token name is required" }),
  yesTokenSymbol: z
    .string()
    .min(1, { message: "Yes token symbol is required" }),
  noTokenName: z.string().min(1, { message: "No token name is required" }),
  noTokenSymbol: z.string().min(1, { message: "No token symbol is required" }),
});

const NewPoll = () => {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [open, setOpen] = useState(false);
  const { address } = useAccount();
  const isMounted = useMounted();
  const { createPoll } = useCapyProtocol();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      question: "",
      avatar: "",
      rule: "",
      durationValue: 1,
      durationUnit: "days",
      yesTokenName: "",
      yesTokenSymbol: "",
      noTokenName: "",
      noTokenSymbol: "",
    },
  });

  const queryClient = useQueryClient(); 

  // Function to add token to wallet
  const addTokenToWallet = async (tokenAddress: string, tokenName: string, tokenSymbol: string) => {
    if (!window.ethereum) {
      console.log("MetaMask not detected");
      return;
    }
    
    try {
      // Get token info from contract
      const decimals = await readContract(config, {
        address: tokenAddress as `0x${string}`,
        abi: erc20Abi,
        functionName: "decimals",
        args: [],
      });
      
      await window.ethereum.request({
        method: "wallet_watchAsset",
        params: {
          type: "ERC20",
          options: {
            address: tokenAddress,
            symbol: tokenSymbol,
            decimals: Number(decimals),
            name: tokenName,
          },
        },
      });
      
      console.log(`${tokenSymbol} token added to wallet successfully`);
    } catch (err) {
      console.error(`Failed to add ${tokenSymbol} token to wallet:`, err);
    }
  };

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    if (!address) {
      toast.error("Please connect wallet");
      return;
    }

    setIsSubmitting(true);

    try {
      const durationInSeconds = getDurationInSeconds(
        data.durationValue,
        data.durationUnit
      );

      // Create the poll
      const result = await createPoll({
        question: data.question,
        avatar: data.avatar || "",
        rule: data.rule || "",
        duration: BigInt(durationInSeconds),
        yesTokenName: data.yesTokenName,
        yesTokenSymbol: data.yesTokenSymbol,
        noTokenName: data.noTokenName,
        noTokenSymbol: data.noTokenSymbol,
      });
      
      // Get the token addresses from the transaction receipt or event logs
      if (result && result.logs) {
        // Extract poll address from logs (implementation would depend on your contract's events)
        // This is a simplified example - you might need to parse the logs differently
        const pollCreatedLog = result.logs.find(log => 
          log.topics && log.topics[0] === "0x..." // Replace with your event signature
        );
        
        if (pollCreatedLog) {
          // Extract poll address and token addresses
          // This is placeholder logic - you'll need to adjust based on your contract
          const pollData = await queryClient.fetchQuery({
            queryKey: ["newly-created-poll", pollCreatedLog.address],
            queryFn: async () => {
              // Query your subgraph or contract to get the poll details
              // Including the yes and no token addresses
              
              // Placeholder for demonstration - replace with actual implementation
              const response = await fetch(`your-api-endpoint/${pollCreatedLog.address}`);
              return response.json();
            }
          });
          
          // Prompt user to add tokens to wallet
          if (pollData && pollData.yesToken && pollData.noToken) {
            // Add YES token to wallet
            await addTokenToWallet(
              pollData.yesToken, 
              data.yesTokenName,
              data.yesTokenSymbol
            );
            
            // Add NO token to wallet
            await addTokenToWallet(
              pollData.noToken,
              data.noTokenName,
              data.noTokenSymbol
            );
          }
        }
      }

      toast.success("Poll created successfully!");
      form.reset();
      setOpen(false);
    } catch (error) {
      console.error("Error creating poll:", error);
      if (error instanceof Error && error.message.includes("0xe450d38c")) {
        toast.error(
          "Please fund your wallet with USDe tokens to create a poll"
        );
      } else {
        toast.error(
          error instanceof Error ? error.message : "Failed to create poll"
        );
      }
    } finally {
      setOpen(false);
      setIsSubmitting(false);

      queryClient.invalidateQueries({ queryKey: ["prediction-markets"] });
    }
  };

  const getDurationInSeconds = (value: number, unit: string): number => {
    const multipliers = {
      seconds: 1,
      minutes: 60,
      hours: 3600,
      days: 86400,
      weeks: 604800,
    };
    return value * multipliers[unit as keyof typeof multipliers];
  };

  const content = (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-4"
      >
        <div className="flex flex-col gap-2">
          <FormLabel>Poll Details</FormLabel>
          <FormField
            control={form.control}
            name="question"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input placeholder="Poll Question" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="avatar"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input placeholder="Avatar URL (optional)" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="rule"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea placeholder="Rules" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex flex-col gap-2">
          <FormLabel className="flex items-center gap-2">
            Duration
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>How long the poll will be active</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </FormLabel>

          <div className="flex items-center gap-2">
            <FormField
              control={form.control}
              name="durationValue"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      className="w-16"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="durationUnit"
              render={({ field }) => (
                <FormItem>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-[110px]">
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-white">
                      <SelectGroup>
                        {["seconds", "minutes", "hours", "days", "weeks"].map(
                          (unit) => (
                            <SelectItem key={unit} value={unit}>
                              {unit}
                            </SelectItem>
                          )
                        )}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <span className="text-sm font-medium">from now, poll ends</span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <FormLabel>Yes Token Details</FormLabel>
          <div className="flex gap-2">
            <FormField
              control={form.control}
              name="yesTokenName"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input placeholder="Token Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="yesTokenSymbol"
              render={({ field }) => (
                <FormItem className="w-24">
                  <FormControl>
                    <Input placeholder="Symbol" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <FormLabel>No Token Details</FormLabel>
          <div className="flex gap-2">
            <FormField
              control={form.control}
              name="noTokenName"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input placeholder="Token Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="noTokenSymbol"
              render={({ field }) => (
                <FormItem className="w-24">
                  <FormControl>
                    <Input placeholder="Symbol" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="h-6"></div>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating Poll..." : "Create Poll"}
        </Button>
      </form>
    </Form>
  );

  if (!isMounted) return null;

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <button className="w-fit font-medium px-8 py-4 rounded-3xl text-xl flex items-center gap-4 bg-[#33CB82] hover:scale-105 transition-all duration-200">
            Create New Poll
            <div className="w-10 h-10 rounded-full bg-[#191A23] flex justify-center items-center">
              <ArrowDown strokeWidth={3} className="text-emerald-400" />
            </div>
          </button>
        </DialogTrigger>
        <DialogContent className="flex flex-col gap-2 sm:max-w-[425px] bg-white sm:rounded-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle>Create New Poll</DialogTitle>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <button className="font-medium px-8 py-4 rounded-3xl text-xl flex items-center gap-4 bg-[#33CB82] hover:scale-105 transition-all duration-200">
          Create New Poll
          <div className="w-10 h-10 rounded-full bg-[#191A23] flex justify-center items-center">
            <ArrowDown strokeWidth={3} className="text-emerald-400" />
          </div>
        </button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle className="text-2xl font-bold text-center mb-6">
            Create New Poll
          </DrawerTitle>
        </DrawerHeader>
        {content}
      </DrawerContent>
    </Drawer>
  );
};

export default NewPoll;