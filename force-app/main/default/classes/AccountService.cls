public class AccountService {
	public static List<Opportunity> getAccountOpportunities(Id accountId) {
        return [SELECT Name, Amount, StageName, CloseDate, MainCompetitors__c, Probability FROM Opportunity WHERE AccountId =:accountId];
    }
}