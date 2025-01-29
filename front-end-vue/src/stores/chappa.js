class ChapaCheckout {
  constructor(e) {
    ;(this.options = {
      publicKey: e.publicKey || 'YOUR_PUBLIC_KEY_HERE',
      customizations: e.customizations || {},
      callbackUrl: e.callbackUrl,
      returnUrl: e.returnUrl,
      availablePaymentMethods: e.availablePaymentMethods || [
        'telebirr',
        'cbebirr',
        'ebirr',
        'mpesa',
      ],
      assetPath: e.assetPath || 'https://assets.chapa.co/inline-assets',
      amount: e.amount,
      currency: e.currency || 'ETB',
      mobile: e.mobile || '',
      tx_ref: e.tx_ref || '',
      showFlag: !1 !== e.showFlag,
      showPaymentMethodsNames: !1 !== e.showPaymentMethodsNames,
      onSuccessfulPayment: e.onSuccessfulPayment || null,
      onPaymentFailure: e.onPaymentFailure || null,
      onClose: e.onClose || null,
    }),
      (this.paymentType = this.options.availablePaymentMethods[0] ?? ''),
      (this.hostedUrl = 'https://api.chapa.co/v1/hosted/pay'),
      (this.chapaUrl = 'https://inline.chapaservices.net/v1/inline/charge'),
      (this.verifyUrl = 'https://inline.chapaservices.net/v1/inline/validate'),
      (this.paymentMethodIcons = {
        telebirr: {
          name: 'telebirr',
          icon: `${this.options.assetPath}/telebirr.svg`,
          validPrefix: '9',
        },
        cbebirr: {
          name: 'CBEBirr',
          icon: `${this.options.assetPath}/cbebirr.svg`,
          validPrefix: ['9', '7'],
        },
        ebirr: {
          name: 'Ebirr',
          icon: `${this.options.assetPath}/ebirr.svg`,
          validPrefix: ['9', '7'],
        },
        mpesa: { name: 'Mpesa', icon: `${this.options.assetPath}/mpesa.svg`, validPrefix: '7' },
        chapa: { name: 'Others via Chapa', icon: `${this.options.assetPath}/chapa.svg` },
      }),
      (this.elements = {})
  }
  initialize(e = 'chapa-inline-form') {
    const t = document.getElementById(e)
    t
      ? ((t.innerHTML =
          '\n              <div id="chapa-phone-input-container"></div>\n              <div id="chapa-error-container" class="chapa-error"></div>\n              <div id="chapa-payment-methods"></div>\n              <button id="chapa-pay-button" type="submit"></button>\n              <div id="chapa-loading-container" class="chapa-loading">\n                  <div class="chapa-spinner"></div>\n                  <p>Processing payment...</p>\n                  <p>Please check your phone for payment prompt.</p>\n              </div>\n          '),
        this.renderPhoneInput(),
        this.renderPaymentMethods(),
        this.renderPayButton(),
        this.applyCustomStyles())
      : console.error(`Container with ID ${e} not found.`)
  }
  validatePhoneNumberOnInput(e) {
    const t = e.target.value
    return /^(251\d{9}|0\d{9}|9\d{8}|7\d{8})$/.test(t)
      ? (this.hideError(), !0)
      : (this.showError('Please enter a valid Ethiopian phone number.'), !1)
  }
  renderPhoneInput() {
    const e = document.getElementById('chapa-phone-input-container'),
      t = this.options.showFlag
    e.innerHTML = `\n              <div class="chapa-phone-input-wrapper">\n                  ${t ? `\n                  <div class="chapa-phone-prefix">\n                      <img src="${this.options.assetPath}/ethiopia-flag.svg" alt="Ethiopia Flag" class="chapa-flag-icon">\n                      <span>+251</span>\n                  </div>` : '\n                  <div class="chapa-phone-prefix">\n                      <span>+251</span>\n                  </div>'}\n                  <div id="phone-input-container"></div>\n                  <svg width="24px" height="24px" viewBox="0 0 24 24"\n                            xmlns="http://www.w3.org/2000/svg" id="secure">\n                            <path\n                                d="M19.42,3.83,12.24,2h0A.67.67,0,0,0,12,2a.67.67,0,0,0-.2,0h0L4.58,3.83A2,2,0,0,0,3.07,5.92l.42,5.51a12,12,0,0,0,7.24,10.11l.88.38h0a.91.91,0,0,0,.7,0h0l.88-.38a12,12,0,0,0,7.24-10.11l.42-5.51A2,2,0,0,0,19.42,3.83ZM15.71,9.71l-4,4a1,1,0,0,1-1.42,0l-2-2a1,1,0,0,1,1.42-1.42L11,11.59l3.29-3.3a1,1,0,0,1,1.42,1.42Z"\n                                style="fill:#7dc400"></path>\n                        </svg>\n              </div>\n          `
    const n = document.getElementById('phone-input-container'),
      a = document.createElement('input')
    ;(a.id = 'chapa-phone-number'),
      (a.className = 'chapa-phone-input'),
      (a.type = 'tel'),
      (a.placeholder = '9|7XXXXXXXX'),
      (a.value = this.options.mobile),
      a.addEventListener('input', (e) => this.validatePhoneNumberOnInput(e)),
      n.appendChild(a)
  }
  handlePayment() {
    const e = document.getElementById('chapa-phone-number').value
    if (!this.validatePhoneNumber(e) || !this.validatePaymentMethod()) return
    const t = {
      amount: this.options.amount,
      currency: this.options.currency,
      tx_ref: this.options.tx_ref || this.generateTxRef(),
      mobile: e,
      payment_method: this.paymentType,
    }
    this.open(t)
  }
  renderPaymentMethods() {
    const e = document.getElementById('chapa-payment-methods')
    ;(e.className = 'chapa-payment-methods-grid'),
      (e.innerHTML = ''),
      this.options.availablePaymentMethods.forEach((t) => {
        if (this.paymentMethodIcons[t]) {
          const n = this.createPaymentMethodElement(t)
          e.appendChild(n)
        }
      })
  }
  createPaymentMethodElement(e) {
    const t = this.paymentMethodIcons[e],
      n = document.createElement('div')
    return (
      (n.className = 'chapa-payment-method'),
      e === this.paymentType && n.classList.add('chapa-selected'),
      (n.innerHTML = `\n              <img src="${t.icon}" alt="${t.name}" class="chapa-payment-icon">\n              ${this.options.showPaymentMethodsNames ? `<span class="chapa-payment-name">${t.name}</span>` : ''}\n          `),
      n.addEventListener('click', () => this.selectPaymentMethod(e, n)),
      n
    )
  }
  selectPaymentMethod(e, t) {
    ;(this.paymentType = e),
      document.querySelectorAll('.chapa-payment-method').forEach((e) => {
        e.classList.remove('chapa-selected')
      }),
      t.classList.add('chapa-selected')
  }
  renderPayButton() {
    const e = document.getElementById('chapa-pay-button')
    ;(e.textContent = this.options.customizations.buttonText || 'Pay Now'),
      (e.className = 'chapa-pay-button'),
      e.addEventListener('click', () => this.handlePayment())
  }
  applyCustomStyles() {
    if (!document.getElementById('chapa-styles')) {
      const e = document.createElement('style')
      ;(e.id = 'chapa-styles'),
        (e.textContent =
          '\n                  .chapa-error { display: none; color: red; margin-bottom: 10px; margin-top: 10px; }\n                  .chapa-loading { display: none; text-align: center; margin-top: 15px; }\n                  .chapa-spinner { display: inline-block; width: 30px; height: 30px; border: 3px solid rgba(0,0,0,.1); border-radius: 50%; border-top-color: #7DC400; animation: chapa-spin 1s ease-in-out infinite; }\n                  @keyframes chapa-spin { to { transform: rotate(360deg); } }\n                  .chapa-payment-methods-grid { display: flex;  gap: 8px; margin: 15px 0; justify-content:  space-between; }\n                  .chapa-payment-method { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 8px; border: 1px solid #e5e7eb; border-radius: 4px; cursor: pointer; width: 60px; height: 60px; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15); }\n                  .chapa-payment-icon { width: 42px; height: 42px; margin-bottom: 4px; }\n                  .chapa-payment-name { font-size: 11px; text-align: center; }\n                  .chapa-selected { background-color: #7dc40024; box-shadow: 0 0 0 1px #7DC400; }\n                  .chapa-input-wrapper { margin-bottom: 10px; ] }\n                  .chapa-input-wrapper label { display: block; margin-bottom: 5px; font-weight: 600; color: #333; }\n                  .chapa-input { width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 16px; outline: none; box-sizing: border-box; transition: border-color 0.3s, box-shadow 0.3s; }\n                  .chapa-input:focus { border-color: #7DC400; box-shadow: 0 0 0 3px #7dc40024; }\n                  .chapa-phone-input-wrapper { position: relative; margin-bottom: 20px; display: flex; align-items: center; border: 1px solid #d1d5db; border-radius: 8px; padding: 8px 12px; }\n                  .chapa-phone-prefix { display: flex; align-items: center; padding: 0 12px; background-color: #ffffff; border-radius: 7px 0 0 7px; height: 100%; font-size: 16px; color: #6b7280; }\n                  .chapa-flag-icon { width: 24px; height: auto; margin-right: 8px; }\n                  .chapa-phone-input { width: 100%; padding: 10px; border: none; border-left: 1px solid #d1d5db;  font-size: 18px; outline: none !important; box-shadow: none !important; box-sizing: border-box; transition: border-color 0.3s, box-shadow 0.3s; }\n                  .chapa-phone-input-wrapper:hover { border-color: #7DC400; box-shadow: 0 0 0 3px #7dc40024; }\n                  .chapa-phone-input-wrapper:hover .chapa-phone-input { border-color: #7DC400; box-shadow: 0 0 0 3px #7dc40024; }\n                  .chapa-pay-button { background-color: #7DC400; color: #FFFFFF; border: none; border-radius: 4px; padding: 10px; font-size: 16px; cursor: pointer; width: 100%; transition: background-color 0.3s; }\n                  .chapa-pay-button:hover { background-color: #6baf00; }\n                  #phone-input-container { width: 100%; }\n              '),
        document.head.appendChild(e)
    }
    if (this.options.customizations.styles) {
      const e = document.createElement('style')
      ;(e.textContent = this.options.customizations.styles), document.head.appendChild(e)
    }
  }
  validatePhoneNumber(e) {
    if (!/^(251\d{9}|0\d{9}|9\d{8}|7\d{8})$/.test(e))
      return this.showError('Please enter a valid Phone Number.'), !1
    '0' === e.charAt(0) && (e = e.slice(1))
    if ('telebirr' === this.paymentType && !1 === /^(2519\d{8}|9\d{8})$/.test(e))
      return this.showError('Please enter a valid Telebirr Phone Number.'), !1
    return (
      'mpesa' !== this.paymentType ||
      !1 !== /^(2519\d{8}|7\d{8})$/.test(e) ||
      (this.showError('Please enter a valid Mpesa Phone Number.'), !1)
    )
  }
  validatePaymentMethod() {
    return !!this.paymentType || (this.showError('Please select a payment method.'), !1)
  }
  showError(e) {
    const t = document.getElementById('chapa-error-container')
    ;(t.textContent = e), (t.style.display = 'block')
  }
  hideError() {
    document.getElementById('chapa-error-container').style.display = 'none'
  }
  showLoading() {
    document.getElementById('chapa-loading-container').style.display = 'block'
  }
  hideLoading() {
    document.getElementById('chapa-loading-container').style.display = 'none'
  }
  async open(e) {
    try {
      if ('chapa' === this.paymentType) return void this.submitChapaForm(e)
      const t = new FormData()
      for (const [n, a] of Object.entries(e)) t.append(n, a)
      ;(document.getElementById('chapa-pay-button').disabled = !0), this.showLoading()
      const n = await fetch(`${this.chapaUrl}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${this.options.publicKey}` },
          body: t,
        }),
        a = await n.json()
      if ('success' !== a.status)
        return (
          this.showError('Transaction initiation failed: ' + a.message),
          (document.getElementById('chapa-pay-button').disabled = !1),
          this.hideLoading(),
          void (this.options.onPaymentFailure && this.options.onPaymentFailure(a.message))
        )
      const o = a.data.meta.ref_id
      await this.verifyPayment(o)
    } catch (e) {
      this.showError('Error during transaction: ' + e.message),
        (document.getElementById('chapa-pay-button').disabled = !1),
        this.hideLoading(),
        this.options.onPaymentFailure && this.options.onPaymentFailure(e.message)
    }
  }
  async verifyPayment(e) {
    try {
      let t = !1
      for (; !t; ) {
        const n = new FormData()
        n.append('reference', e), n.append('payment_method', this.paymentType)
        const a = await fetch(`${this.verifyUrl}`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${this.options.publicKey}` },
            body: n,
          }),
          o = await a.json()
        if (
          ('success' !== o.status && this.showError('Payment verification failed: ' + o.message),
          'success' === o.data.status)
        )
          (t = !0), this.hideLoading(), this.handleSuccessfulPayment(o, e)
        else if ('pending' !== o.data.status) {
          this.hideLoading(),
            this.showError('Payment verification failed: ' + o.message),
            this.options.onPaymentFailure && this.options.onPaymentFailure(o.message)
          break
        }
        await this.delay(3e3)
      }
    } catch (e) {
      this.hideLoading(),
        this.showError('Error during payment verification: ' + e.message),
        this.options.onPaymentFailure && this.options.onPaymentFailure(e.message)
    }
  }
  handleSuccessfulPayment(e, t) {
    const n = e.data?.callback_url || this.options.callbackUrl,
      a = e.data?.return_url || this.options.returnUrl
    if ((n && this.sendCallback(t, n), a)) window.location.href = a
    else {
      const e = this.options.customizations.successMessage || 'Payment is successful!'
      this.showPopup(e, () => {
        document.getElementById('chapa-pay-button').disabled = !0
      })
    }
    this.options.onSuccessfulPayment && this.options.onSuccessfulPayment(e, t)
  }
  showPopup(e, t = null) {
    const n = document.createElement('div')
    ;(n.id = 'popup-container'),
      (n.style.position = 'fixed'),
      (n.style.top = '0'),
      (n.style.left = '0'),
      (n.style.width = '100%'),
      (n.style.height = '100%'),
      (n.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'),
      (n.style.display = 'flex'),
      (n.style.justifyContent = 'center'),
      (n.style.alignItems = 'center'),
      (n.style.zIndex = '1000')
    const a = document.createElement('div')
    ;(a.style.backgroundColor = '#fff'),
      (a.style.padding = '30px'),
      (a.style.borderRadius = '15px'),
      (a.style.textAlign = 'center'),
      (a.style.boxShadow = '0 0 20px rgba(0, 0, 0, 0.3)'),
      (a.style.maxWidth = '90%'),
      (a.style.width = '350px')
    const o = document.createElement('p')
    ;(o.textContent = e),
      (o.style.fontSize = '16px'),
      (o.style.marginBottom = '20px'),
      (o.style.color = '#0D1B34'),
      (o.style.fontWeight = 'bold'),
      a.appendChild(o)
    const i = document.createElement('button')
    ;(i.textContent = 'Okay'),
      (i.style.marginTop = '20px'),
      (i.style.padding = '10px 20px'),
      (i.style.backgroundColor = '#7DC400'),
      (i.style.color = '#FFFFFF'),
      (i.style.border = 'none'),
      (i.style.borderRadius = '5px'),
      (i.style.cursor = 'pointer'),
      (i.style.fontSize = '16px'),
      i.addEventListener('click', () => {
        document.body.removeChild(n), t && t(), this.options.onClose && this.options.onClose()
      }),
      a.appendChild(i),
      n.appendChild(a),
      document.body.appendChild(n),
      t ||
        setTimeout(() => {
          n.parentNode &&
            (document.body.removeChild(n), this.options.onClose && this.options.onClose())
        }, 5e3)
  }
  sendCallback(e, t) {
    console.log('Sending callback:', e, t)
    const n = JSON.stringify({ tx_ref: e, status: 'success' })
    fetch(t, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: n }).catch(
      (e) => console.error('Error sending callback:', e),
    )
  }
  submitChapaForm(e) {
    const t = document.createElement('form')
    ;(t.method = 'POST'), (t.action = this.hostedUrl)
    const n = {
      public_key: this.options.publicKey,
      tx_ref: e.tx_ref,
      amount: e.amount,
      currency: e.currency,
    }
    this.options.callbackUrl && (n.callback_url = this.options.callbackUrl),
      this.options.returnUrl && (n.return_url = this.options.returnUrl)
    for (const [e, a] of Object.entries(n)) {
      const n = document.createElement('input')
      ;(n.type = 'hidden'), (n.name = e), (n.value = a), t.appendChild(n)
    }
    document.body.appendChild(t), t.submit()
  }
  generateTxRef() {
    return 'tx_' + Math.random().toString(36).substr(2, 9)
  }
  delay(e) {
    return new Promise((t) => setTimeout(t, e))
  }
}
window.ChapaCheckout = ChapaCheckout
