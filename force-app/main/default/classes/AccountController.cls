public class AccountController {
	@AuraEnabled(cacheable=true)
    public static List<Opportunity> getAccountOpportunities(Id accountId) {
        return AccountService.getAccountOpportunities(accountId);
    }
}