class GoldenBeans {
    constructor() {
        this.balance = 0;
        this.history = [];
        this.init();
    }

    roundToTwoDecimals(value) {
        return Math.round(value * 100) / 100;
    }

    async init() {
        await this.loadFromStorage();
        this.checkAndApplyInterest();
        this.updateDisplay();
    }

    async loadFromStorage() {
        const data = await giteeAPI.getAllData();
        if (data && data.records && data.records.length > 0) {
            this.history = data.records;
            this.lastInterestDate = data.lastInterestDate ? new Date(data.lastInterestDate) : new Date();
            this.calculateBalance();
        } else {
            this.balance = 0;
            this.history = [];
            this.lastInterestDate = new Date();
        }
    }

    async saveToStorage() {
        await giteeAPI.saveData(this.history, this.lastInterestDate.toISOString());
    }

    calculateBalance() {
        this.balance = this.roundToTwoDecimals(this.history.reduce((total, record) => {
            if (record.type === 'deposit' || record.type === 'interest') {
                return total + record.amount;
            } else if (record.type === 'withdraw') {
                return total - record.amount;
            }
            return total;
        }, 0));
    }

    async checkAndApplyInterest() {
        this.calculateBalance();
        const now = new Date();
        const lastDate = new Date(this.lastInterestDate);

        const monthsPassed = this.calculateMonthsPassed(lastDate, now);

        if (monthsPassed > 0) {
            await this.applyInterestByMonths(lastDate, monthsPassed);
        }
    }

    calculateMonthsPassed(startDate, endDate) {
        let months = 0;
        let currentDate = new Date(startDate);
        currentDate.setDate(1);
        currentDate.setHours(0, 0, 0, 0);

        const endMonth = new Date(endDate);
        endMonth.setDate(1);
        endMonth.setHours(0, 0, 0, 0);

        while (currentDate < endMonth) {
            months++;
            currentDate.setMonth(currentDate.getMonth() + 1);
        }

        return months;
    }

    getBalanceAtDate(targetDate) {
        const targetTime = targetDate.getTime();
        let balance = 0;

        for (const record of this.history) {
            const recordTime = new Date(record.date).getTime();
            if (recordTime <= targetTime) {
                if (record.type === 'deposit' || record.type === 'interest') {
                    balance += record.amount;
                } else if (record.type === 'withdraw') {
                    balance -= record.amount;
                }
            }
        }

        return this.roundToTwoDecimals(balance);
    }

    getMinBalanceInCurrentMonth() {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();

        const monthStart = new Date(year, month, 1);
        const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);

        const balanceAtStart = this.getBalanceAtDate(monthStart);
        const balanceAtEnd = this.getBalanceAtDate(monthEnd);

        return Math.min(balanceAtStart, balanceAtEnd);
    }

    calculateInterest(principal) {
        const monthlyRate = 0.06 / 12;
        return this.roundToTwoDecimals(principal * monthlyRate);
    }

    async applyInterestByMonths(startDate, monthsCount) {
        let currentDate = new Date(startDate);
        currentDate.setDate(1);
        currentDate.setHours(0, 0, 0, 0);

        for (let i = 0; i < monthsCount; i++) {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();

            const monthStart = new Date(year, month, 1);
            const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);

            const balanceAtStart = this.getBalanceAtDate(monthStart);
            const balanceAtEnd = this.getBalanceAtDate(monthEnd);
            const principal = Math.min(balanceAtStart, balanceAtEnd);

            if (principal > 0) {
                const interest = this.calculateInterest(principal);

                const record = {
                    type: 'interest',
                    amount: interest,
                    date: new Date(year, month, 1).toISOString(),
                    icon: '📈',
                    label: '利息收入'
                };

                this.history.push(record);
            }

            currentDate.setMonth(currentDate.getMonth() + 1);
        }

        this.history.sort((a, b) => new Date(b.date) - new Date(a.date));
        this.calculateBalance();
        this.lastInterestDate = new Date();
        await this.saveToStorage();
        this.updateDisplay();
        showToast(`✅ 已完成 ${monthsCount} 个月的利息结算！`);
    }

    async deposit(amount) {
        if (amount <= 0) {
            showToast('⚠️ 请输入有效的金额！');
            return false;
        }

        await this.checkAndApplyInterest();

        const roundedAmount = this.roundToTwoDecimals(amount);
        const now = new Date();

        const record = {
            type: 'deposit',
            amount: roundedAmount,
            date: now.toISOString(),
            icon: '🪙',
            label: '存入'
        };

        this.history.unshift(record);
        this.calculateBalance();
        await this.saveToStorage();
        this.updateDisplay();
        showToast(`✅ 成功存入 ${roundedAmount.toFixed(2)} 元！`);
        return true;
    }

    async withdraw(amount) {
        if (amount <= 0) {
            showToast('⚠️ 请输入有效的金额！');
            return false;
        }

        await this.checkAndApplyInterest();

        const roundedAmount = this.roundToTwoDecimals(amount);
        const currentBalance = this.calculateBalance();
        if (roundedAmount > currentBalance) {
            showToast('⚠️ 余额不足，无法支出！');
            return false;
        }

        const now = new Date();

        const record = {
            type: 'withdraw',
            amount: roundedAmount,
            date: now.toISOString(),
            icon: '💸',
            label: '支出'
        };

        this.history.unshift(record);
        this.calculateBalance();
        await this.saveToStorage();
        this.updateDisplay();
        showToast(`✅ 成功支出 ${roundedAmount.toFixed(2)} 元！`);
        return true;
    }

    async deleteRecord(index) {
        this.history.splice(index, 1);
        this.calculateBalance();
        await this.saveToStorage();
        this.updateDisplay();
        showToast(`✅ 已删除该记录！`);
        return true;
    }

    updateDisplay() {
        document.getElementById('balance').textContent = this.balance.toFixed(2);
        const minBalance = this.getMinBalanceInCurrentMonth();
        const nextInterest = this.calculateInterest(minBalance);
        document.getElementById('nextInterest').textContent = nextInterest.toFixed(2);
        this.updateHistory();
    }

    updateHistory() {
        const historyList = document.getElementById('historyList');

        if (this.history.length === 0) {
            historyList.innerHTML = '<p class="empty-message">还没有记录哦，快去存钱吧！</p>';
            return;
        }

        historyList.innerHTML = this.history.map((record, index) => {
            const date = new Date(record.date);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const formattedDate = `${year}/${month}/${day}`;

            const amountClass = record.type;
            const amountPrefix = record.type === 'withdraw' ? '-' : '+';

            return `
                <div class="history-item ${record.type}">
                    <div class="history-icon">${record.icon}</div>
                    <div class="history-details">
                        <div class="history-type">${record.label}</div>
                        <div class="history-date">${formattedDate}</div>
                    </div>
                    <div class="history-amount ${amountClass}">
                        ${amountPrefix}${record.amount.toFixed(2)}元
                    </div>
                    <button class="delete-btn" onclick="openDeleteModal(${index})">🗑️</button>
                </div>
            `;
        }).join('');
    }
}
