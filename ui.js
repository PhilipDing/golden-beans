let app;
let pendingOperation = null;
let pendingDeleteIndex = null;

async function initApp() {
    app = new GoldenBeans();
    await app.init();
    document.getElementById('loadingOverlay').style.display = 'none';
}

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

function openInterestInfoModal() {
    document.getElementById('interestInfoModal').classList.add('active');
}

function closeInterestInfoModal() {
    document.getElementById('interestInfoModal').classList.remove('active');
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
        closeInterestInfoModal();
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

initApp();
