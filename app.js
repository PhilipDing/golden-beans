class GoldenBeans {
    constructor() {
        this.balance = 0;
        this.history = [];
        this.annualInterestRate = 0.06;
        this.monthlyInterestRate = this.annualInterestRate / 12;
        this.init();
    }

    async init() {
        await this.loadFromStorage();
        this.checkAndApplyInterest();
        this.updateDisplay();
    }

    async loadFromStorage() {
        const data = await jsonBinAPI.getAllData();
        if (data && data.records && data.records.length > 0) {
            this.balance = data.balance;
            this.history = data.records;
            this.lastInterestDate = data.lastInterestDate ? new Date(data.lastInterestDate) : new Date();
        }
    }

    async saveToStorage() {
        await jsonBinAPI.saveData(this.balance, this.history, this.lastInterestDate);
    }

    async checkAndApplyInterest() {
        const now = new Date();
        const lastDate = new Date(this.lastInterestDate);

        const daysPassed = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));
        const fullMonthsPassed = Math.floor(daysPassed / 30);

        if (fullMonthsPassed > 0 && this.balance > 0) {
            await this.applyMultiMonthInterest(fullMonthsPassed);
        }
    }

    async applyMultiMonthInterest(months) {
        const monthlyRate = 0.005;
        const originalBalance = this.balance;
        const newBalance = originalBalance * Math.pow(1 + monthlyRate, months);
        const totalInterest = newBalance - originalBalance;

        if (totalInterest > 0) {
            this.balance = newBalance;

            const lastDate = new Date(this.lastInterestDate);
            lastDate.setMonth(lastDate.getMonth() + months);
            this.lastInterestDate = lastDate;

            const record = {
                type: 'interest',
                amount: totalInterest,
                date: new Date().toISOString(),
                icon: '📈',
                label: months === 1 ? '利息收入' : `利息收入（${months}个月）`
            };

            this.history.unshift(record);
            await this.saveToStorage();
            this.updateDisplay();

            if (months === 1) {
                showToast(`🎉 太棒了！你获得了 ${totalInterest.toFixed(2)} 元利息！`);
            } else {
                showToast(`🎉 太棒了！你获得了 ${months} 个月的利息，共 ${totalInterest.toFixed(2)} 元！`);
            }
        }
    }

    async deposit(amount) {
        if (amount <= 0) {
            showToast('⚠️ 请输入有效的金额！');
            return false;
        }

        await this.checkAndApplyInterest();

        this.balance += amount;
        const now = new Date();

        const record = {
            type: 'deposit',
            amount: amount,
            date: now.toISOString(),
            icon: '🪙',
            label: '存入'
        };

        this.history.unshift(record);
        await this.saveToStorage();
        this.updateDisplay();
        showToast(`✅ 成功存入 ${amount.toFixed(2)} 元！`);
        return true;
    }

    async withdraw(amount) {
        if (amount <= 0) {
            showToast('⚠️ 请输入有效的金额！');
            return false;
        }

        await this.checkAndApplyInterest();

        if (amount > this.balance) {
            showToast('⚠️ 余额不足，无法支出！');
            return false;
        }

        this.balance -= amount;
        const now = new Date();

        const record = {
            type: 'withdraw',
            amount: amount,
            date: now.toISOString(),
            icon: '💸',
            label: '支出'
        };

        this.history.unshift(record);
        await this.saveToStorage();
        this.updateDisplay();
        showToast(`✅ 成功支出 ${amount.toFixed(2)} 元！`);
        return true;
    }

    async deleteRecord(index) {
        const record = this.history[index];

        if (record.type === 'deposit') {
            this.balance -= record.amount;
        } else if (record.type === 'withdraw') {
            this.balance += record.amount;
        } else if (record.type === 'interest') {
            this.balance -= record.amount;
        }

        this.history.splice(index, 1);
        await this.saveToStorage();
        this.updateDisplay();
        showToast(`✅ 已删除该记录！`);
        return true;
    }

    updateDisplay() {
        document.getElementById('balance').textContent = this.balance.toFixed(2);
        const nextInterest = this.balance * this.monthlyInterestRate;
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

let app;
let pendingOperation = null;
let pendingDeleteIndex = null;

async function initApp() {
    app = new GoldenBeans();
    await app.init();
    document.getElementById('loadingOverlay').style.display = 'none';
}

initApp();

function openDepositModal() {
    document.getElementById('depositModal').classList.add('active');
    document.getElementById('depositAmount').value = '';
    document.getElementById('depositAmount').focus();

    const btn = document.getElementById('depositConfirmBtn');
    btn.disabled = false;
    btn.classList.remove('loading');
}

function closeDepositModal() {
    document.getElementById('depositModal').classList.remove('active');
}

function openWithdrawModal() {
    document.getElementById('withdrawModal').classList.add('active');
    document.getElementById('withdrawAmount').value = '';
    document.getElementById('withdrawAmount').focus();

    const btn = document.getElementById('withdrawConfirmBtn');
    btn.disabled = false;
    btn.classList.remove('loading');
}

function closeWithdrawModal() {
    document.getElementById('withdrawModal').classList.remove('active');
}

function setDepositAmount(amount) {
    document.getElementById('depositAmount').value = amount;
}

function setWithdrawAmount(amount) {
    document.getElementById('withdrawAmount').value = amount;
}

async function confirmDeposit() {
    const amount = parseFloat(document.getElementById('depositAmount').value);

    if (isNaN(amount) || amount <= 0) {
        showToast('⚠️ 请输入有效的金额！');
        return;
    }

    pendingOperation = { type: 'deposit', amount: amount };
    openPasswordModal();
}

async function confirmWithdraw() {
    const amount = parseFloat(document.getElementById('withdrawAmount').value);

    if (isNaN(amount) || amount <= 0) {
        showToast('⚠️ 请输入有效的金额！');
        return;
    }

    pendingOperation = { type: 'withdraw', amount: amount };
    openPasswordModal();
}

function openPasswordModal() {
    const title = document.getElementById('passwordModalTitle');
    if (pendingDeleteIndex !== null) {
        title.textContent = '🗑️ 删除记录';
    } else if (pendingOperation && pendingOperation.type === 'deposit') {
        title.textContent = '🪙 存入金豆豆';
    } else if (pendingOperation && pendingOperation.type === 'withdraw') {
        title.textContent = '💸 支出金豆豆';
    } else {
        title.textContent = '🔐 密码验证';
    }

    document.getElementById('passwordModal').classList.add('active');
    document.getElementById('passwordInput').value = '';
    document.getElementById('passwordInput').focus();

    const btn = document.getElementById('passwordConfirmBtn');
    btn.disabled = false;
    btn.classList.remove('loading');
}

function closePasswordModal() {
    document.getElementById('passwordModal').classList.remove('active');
    pendingOperation = null;
    pendingDeleteIndex = null;
}

async function confirmPassword() {
    const password = document.getElementById('passwordInput').value;

    const requiredPassword = pendingDeleteIndex !== null ? '0000' : '0816';

    if (password !== requiredPassword) {
        showToast('⚠️ 密码错误，请重试！');
        document.getElementById('passwordInput').value = '';
        document.getElementById('passwordInput').focus();
        return;
    }

    const btn = document.getElementById('passwordConfirmBtn');
    const btnText = btn.querySelector('.btn-text');
    const btnLoading = document.getElementById('passwordBtnLoading');

    btn.disabled = true;
    btnText.style.display = 'none';
    btnLoading.style.display = 'inline';

    let success = false;
    if (pendingOperation) {
        if (pendingOperation.type === 'deposit') {
            success = await app.deposit(pendingOperation.amount);
        } else if (pendingOperation.type === 'withdraw') {
            success = await app.withdraw(pendingOperation.amount);
        }
    } else if (pendingDeleteIndex !== null) {
        success = await app.deleteRecord(pendingDeleteIndex);
    }

    btn.disabled = false;
    btnText.style.display = 'inline';
    btnLoading.style.display = 'none';

    if (success) {
        if (pendingOperation) {
            if (pendingOperation.type === 'deposit') {
                closeDepositModal();
            } else if (pendingOperation.type === 'withdraw') {
                closeWithdrawModal();
            }
        }
        closePasswordModal();
    }
}

function openDeleteModal(index) {
    pendingDeleteIndex = index;
    openPasswordModal();
}

function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeDepositModal();
        closeWithdrawModal();
        closePasswordModal();
    }
});

document.getElementById('depositAmount').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        confirmDeposit();
    }
});

document.getElementById('withdrawAmount').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        confirmWithdraw();
    }
});

document.getElementById('passwordInput').addEventListener('keypress', function (event) {
    if (event.key === 'Enter') {
        confirmPassword();
    }
});
