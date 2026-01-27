function openCalculatorModal() {
    document.getElementById('calculatorModal').classList.add('active');
    document.getElementById('calculatorPrincipal').value = '';
    document.getElementById('calculatorMonths').value = '';
    document.getElementById('calculatorResult').style.display = 'none';
    document.getElementById('calculatorPrincipal').focus();
}

function closeCalculatorModal() {
    document.getElementById('calculatorModal').classList.remove('active');
}

function calculateInterest() {
    const principal = parseFloat(document.getElementById('calculatorPrincipal').value);
    const months = parseInt(document.getElementById('calculatorMonths').value);

    if (isNaN(principal) || principal <= 0) {
        showToast('⚠️ 请输入有效的存入金额！');
        return;
    }

    if (isNaN(months) || months <= 0) {
        showToast('⚠️ 请输入有效的月数！');
        return;
    }

    const monthlyRate = 0.005;
    const total = principal * Math.pow(1 + monthlyRate, months);
    const interest = total - principal;

    document.getElementById('resultPrincipal').textContent = principal.toFixed(2) + ' 元';
    document.getElementById('resultInterest').textContent = interest.toFixed(2) + ' 元';
    document.getElementById('resultTotal').textContent = total.toFixed(2) + ' 元';
    document.getElementById('calculatorResult').style.display = 'block';

    showToast('✅ 计算完成！');
}

document.getElementById('calculatorPrincipal').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        document.getElementById('calculatorMonths').focus();
    }
});

document.getElementById('calculatorMonths').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        calculateInterest();
    }
});

document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeCalculatorModal();
    }
});