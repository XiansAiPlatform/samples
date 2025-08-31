import { flowRestService } from '../../../services/flowRestService';
import type { ContractEntityData } from '../../../types';
import { getCurrentDocumentIdGlobal } from '../../../utils/documentUtils';

export class LegalDataService {

  /**
   * Get the current contract document
   * @param jwtToken - Optional JWT token for authenticated requests
   * @returns The current contract data or null if not found
   */
   async getCurrentContract(jwtToken?: string): Promise<ContractEntityData | null> {
    const documentId = getCurrentDocumentIdGlobal();
  
    try {
      console.log(`[LegalDataService] Getting validated document with ID: ${documentId}`);
      
      const response = await flowRestService.callRPC('GetValidatedDocument', {
        documentId: documentId
      }, jwtToken);
      
      console.log(`[LegalDataService] GetValidatedDocument response:`, response);
      
      if (response.success && response.data) {
        console.log(`[LegalDataService] Successfully extracted contract data:`, response.data);
        return response.data as ContractEntityData;
      } else {
        console.error(`[LegalDataService] Failed to get validated document:`, response.error);
        return null;
      }
      
    } catch (error) {
      console.error(`[LegalDataService] Error getting validated document:`, error);
      return null;
    }
  }
}

// Export a singleton instance for convenience
export const legalDataService = new LegalDataService();
