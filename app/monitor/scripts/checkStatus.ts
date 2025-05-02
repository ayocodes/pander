// scripts/checkStatus.ts
import 'dotenv/config';
import { queues } from '../library/queue/config';

async function checkStatus() {
  console.log('Checking queue status...');
  
  try {
    // Check poll monitor queue
    const monitorJobs = await queues.pollMonitor.getJobs(['active', 'waiting', 'delayed']);
    console.log('Poll monitor jobs:', monitorJobs.length);
    
    // Check Redis connection
    const client = queues.pollMonitor.client;
    try {
      const isConnected = await client.then(redis => redis.ping());
      console.log('Redis connection:', isConnected === 'PONG' ? 'OK' : 'Failed');
    } catch (error) {
      console.error('Redis connection failed:', error);
    }
    
    // Check repeatable jobs
    const repeatableJobs = await queues.pollMonitor.getRepeatableJobs();
    console.log('Repeatable jobs:', repeatableJobs);
    
  } catch (error) {
    console.error('Status check failed:', error);
  }
}

checkStatus().catch(console.error);