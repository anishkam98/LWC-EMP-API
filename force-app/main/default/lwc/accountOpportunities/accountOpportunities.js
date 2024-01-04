import { LightningElement, wire, api } from 'lwc';
import getAccountOpportunities from '@salesforce/apex/AccountController.getAccountOpportunities';
import { subscribe, onError } from 'lightning/empApi';
import { refreshApex } from '@salesforce/apex'
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

const COLUMNS = [
    {   
        label: 'Opportunity Name', 
        fieldName: 'opportunityURL',
        type: 'url', 
        wrapText: true,
        typeAttributes: { 
            label: { fieldName: 'Name' },
            target: '_blank',
            tooltip: 'Go to Opportunity page'
        }
    },
    {
        label: 'Amount', 
        fieldName: 'Amount', 
        type: 'currency' 
    },
    { 
        label: 'Stage', 
        fieldName: 'StageName', 
        type: 'text' 
    },
    { 
        label: 'Close Date', 
        fieldName: 'CloseDate', 
        type: 'date' 
    },
    { 
        label: 'Main Competitors', 
        fieldName: 'MainCompetitors__c', 
        type: 'text' 
    },
    { 
        label: 'Probability', 
        fieldName: 'Probability', 
        type: 'text'
    }
];

const CHANNEL_NAME = '/data/OpportunityChangeEvent'; // Need to ensure that Opportunity is selected as a CDC entity in Setup

export default class AccountOpportunities extends LightningElement {
    @api recordId;
    columns = COLUMNS;
    opportunityData = [];
    numberOfOpportunities = 0;
    shouldShowTable = false;
    opportunityIds = new Set([]);
    wiredOpportunityResult;

    connectedCallback() {
        this.handleSubscribe();
        this.registerErrorListener();
    }

    @wire(getAccountOpportunities, { accountId: '$recordId' })
    wiredAccountOpportunities(result) {
        this.wiredOpportunityResult = result;
        if (result.data) {
            const opportunities = [];
            if(result.data.length > 0) {
                this.numberOfOpportunities = result.data.length;
                this.shouldShowTable = true;
            }

            for(let i=0; i<result.data.length; i++) {
                // Initialize temporary opportunity object
                let opportunity = {};

                // Assign object field values
                opportunity.Name = result.data[i].Name;
                opportunity.opportunityURL = `/lightning/r/Opportunity/${result.data[i].Id}/view`;
                opportunity.Amount = result.data[i].Amount;
                opportunity.StageName = result.data[i].StageName;
                opportunity.CloseDate = result.data[i].CloseDate;
                opportunity.MainCompetitors__c = result.data[i].MainCompetitors__c;
                opportunity.Probability = result.data[i].Probability.toString() + '%';

                // Add to opportunity array
                opportunities.push(opportunity);

                // Add Ids to Set for CDC logic
                this.opportunityIds.add(result.data[i].Id);
            }

            this.opportunityData = opportunities;
        } 
        else if (result.error) {
            this.showErrorToastMessage(result.error);
        }
    }

    registerErrorListener() {
        onError((error) => {
            console.log('Error from server: ', JSON.stringify(error));
        })
    }

    handleSubscribe() {
        const messageCallback = (response) => {
            if(response.data.payload.ChangeEventHeader.recordIds) {
                const changedOpportunityIds = Array.from(response.data.payload.ChangeEventHeader.recordIds);
    
                for(let i=0; i<changedOpportunityIds.length; i++) {
                    console.log(this.opportunityIds.has(changedOpportunityIds[i]))
                    if(this.opportunityIds.has(changedOpportunityIds[i])) {
                        refreshApex(this.wiredOpportunityResult);
                        break;
                    }
                } 
            }
        }

        subscribe(CHANNEL_NAME, -1, messageCallback).then(response => {
            console.log('Sending request to subscribe to ', JSON.stringify(CHANNEL_NAME));
        })
    }

    showErrorToastMessage(error) {
        const event = new ShowToastEvent({
            title: 'Error',
            message: error,
            variant: 'error',
            mode: 'dismissable'
        });
        this.dispatchEvent(event);
    }
}