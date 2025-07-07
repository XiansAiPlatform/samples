import { ActivityData } from '../../types';

export class ActivityLogManager {
  private pendingActivityLogs = new Map<number, ActivityData[]>();

  getActivityLogStates(): Map<number, ActivityData[]> {
    return new Map(this.pendingActivityLogs);
  }

  addActivityLog(stepIndex: number, activityData: ActivityData): void {
    console.log(`[ActivityLogManager] 🔸 Adding ActivityLog for step ${stepIndex}:`, activityData.summary);
    
    const existingActivities = this.pendingActivityLogs.get(stepIndex) || [];
    const newActivity = {
      ...activityData,
      id: activityData.id || `${Date.now()}-${Math.random()}`
    };
    
    this.pendingActivityLogs.set(stepIndex, [...existingActivities, newActivity]);
    console.log(`[ActivityLogManager] 🔸 Step ${stepIndex} now has ${this.pendingActivityLogs.get(stepIndex)?.length} pending activities`);
  }

  clearActivityLogs(stepIndex: number): void {
    console.log(`[ActivityLogManager] 🧹 Clearing ActivityLog for step ${stepIndex}`);
    const clearedCount = this.pendingActivityLogs.get(stepIndex)?.length || 0;
    this.pendingActivityLogs.delete(stepIndex);
    console.log(`[ActivityLogManager] 🧹 Cleared ${clearedCount} activities for step ${stepIndex}`);
  }

  getPendingActivitiesForStep(stepIndex: number): ActivityData[] {
    return this.pendingActivityLogs.get(stepIndex) || [];
  }

  extractAndClearPendingActivities(stepIndex: number): ActivityData[] {
    const pendingActivities = this.pendingActivityLogs.get(stepIndex) || [];
    
    if (pendingActivities.length > 0) {
      console.log(`[ActivityLogManager] 📋 Extracting ${pendingActivities.length} ActivityLog entries for step ${stepIndex}`);
      this.pendingActivityLogs.delete(stepIndex);
      console.log(`[ActivityLogManager] 🔗 Cleared ${pendingActivities.length} pending activities for step ${stepIndex} after extraction`);
      return [...pendingActivities];
    }
    
    return [];
  }

  handleActivityLogMessage(message: any, activeStep: number | null, addActivityLog: (stepIndex: number, activityData: ActivityData) => void): void {
    console.log('[ActivityLogManager] 📊 ActivityLog received:', message);
    
    // Extract ActivityLog data
    const activityData = message.messageType === 'ActivityLog' ? message :
                        message.data?.metadata || 
                        message.metadata || 
                        message.data?.Metadata || 
                        message.Metadata ||
                        message.data;
    
    if (activityData && activityData.messageType === 'ActivityLog') {
      // Add to pending ActivityLog for the current active step
      if (activeStep !== null) {
        console.log('[ActivityLogManager] 📋 Adding ActivityLog to pending list for step:', activeStep);
        
        addActivityLog(activeStep, {
          summary: activityData.summary,
          details: activityData.details,
          success: activityData.success,
          timestamp: activityData.timestamp,
          id: `${Date.now()}-${Math.random()}`
        });
      } else {
        console.warn('[ActivityLogManager] ⚠️ No active step available for ActivityLog:', activityData.summary);
      }
    } else {
      console.warn('[ActivityLogManager] ⚠️ Invalid ActivityLog data:', activityData);
    }
  }

  clear(): void {
    this.pendingActivityLogs.clear();
  }
} 