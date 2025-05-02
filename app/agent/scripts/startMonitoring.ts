// scripts/startMonitoring.ts
import 'dotenv/config';
import { queues } from '../library/queue/config';

async function startMonitoring() {
  console.log('Adding initial monitoring job...');
  
  try {
    // Add the first monitoring job
    const job = await queues.pollMonitor.add(
      'check-new-polls',
      {},
      {
        repeat: {
          every: 60000, // Every minute
        },
        jobId: 'initial-poll-monitor'
      }
    );
    
    console.log('Initial monitoring job added:', job.id);
  } catch (error) {
    console.error('Failed to add monitoring job:', error);
  }
}

startMonitoring().catch(console.error);