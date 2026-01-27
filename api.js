class JsonBinAPI {
    constructor(apiKey, binId) {
        this.apiKey = apiKey;
        this.binId = binId;
        this.baseUrl = 'https://api.jsonbin.io/v3';
    }

    getHeaders() {
        return {
            'Content-Type': 'application/json',
            'X-Master-Key': this.apiKey
        };
    }

    async getData() {
        try {
            const response = await fetch(`${this.baseUrl}/b/${this.binId}/latest`, {
                method: 'GET',
                headers: this.getHeaders()
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data.record;
        } catch (error) {
            console.error('Error fetching data from JsonBin:', error);
            return null;
        }
    }

    async updateData(data) {
        try {
            const response = await fetch(`${this.baseUrl}/b/${this.binId}`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            return result.record;
        } catch (error) {
            console.error('Error updating data to JsonBin:', error);
            return null;
        }
    }

    async getAllData() {
        return await this.getData();
    }

    async saveData(balance, records, lastInterestDate) {
        const data = {
            balance: balance,
            records: records,
            lastInterestDate: lastInterestDate.toISOString()
        };

        const result = await this.updateData(data);
        return result !== null;
    }
}

const jsonBinAPI = new JsonBinAPI(
    '$2a$10$7HxQHGmX3HX93FmglToz1.fo7uQaY1UP8TfmNiob6MVB71K7pGOPy',
    '6978ba92d0ea881f4089eeb1'
);