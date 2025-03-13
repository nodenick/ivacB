(function completeProcessFlow() {
    const csrfToken = csrf_token;
    let retryAttempts = 0;
    const RETRY_DELAY_BASE = 20000;
    const MAX_RETRY_DELAY = 30000;
    let recaptchaToken = "";
    const MIN_RANDOM_DELAY = 1000;  // Increased minimum delay
    const MAX_RANDOM_DELAY = 3000;  // Increased maximum delay
    const AJAX_TIMEOUT = 150000;
    const RATE_LIMIT_DELAY = 600000; // Increased to 60 seconds for Cloudflare rate limits
    const CLOUDFLARE_RATE_LIMIT_DELAY = 300000; // 5 minutes for Cloudflare 1015 errors
    const startStep = prompt(
      "Enter 1 to start from pre-step test, 2 to start from AppInfo:"
    );
  
    // Track consecutive failures to detect Cloudflare blocks
    let consecutiveFailures = 0;
    const MAX_CONSECUTIVE_FAILURES = 50;
  
    function getRetryDelay() {
      let delay = RETRY_DELAY_BASE * Math.pow(2, retryAttempts);
      if (delay >= MAX_RETRY_DELAY) {
        retryAttempts = 0;
        return MAX_RETRY_DELAY;
      }
      return delay;
    }
  
    function randomDelay() {
      const delay = Math.floor(
        Math.random() * (MAX_RANDOM_DELAY - MIN_RANDOM_DELAY) + MIN_RANDOM_DELAY
      );
      return new Promise(resolve => setTimeout(resolve, delay));
    }
  
    function resetRetries() {
      retryAttempts = 0;
      consecutiveFailures = 0;
    }
  
    // Handle various error types including Cloudflare errors
    function handleError(error, retryFunction) {
      console.error("Error details:", error);
      
      // Check if this is a Cloudflare error (1015)
      const isCloudflareError = 
        (error.responseText && error.responseText.includes("Error 1015")) ||
        (error.statusText && error.statusText.includes("1015"));
      
      consecutiveFailures++;
      
      if (isCloudflareError || consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
        console.log("Cloudflare rate limit detected or too many consecutive failures. Waiting 5 minutes...");
        consecutiveFailures = 0;
        setTimeout(retryFunction, CLOUDFLARE_RATE_LIMIT_DELAY);
      } else if (error.status === 429) {
        console.log("429 Too Many Requests detected. Waiting 2 minutes...");
        setTimeout(retryFunction, RATE_LIMIT_DELAY);
      } else {
        retryAttempts++;
        setTimeout(retryFunction, getRetryDelay());
      }
    }
  
    // Single request with jitter and proper headers
    function makeRequest(url, method, data = null) {
      // Add a random query parameter to avoid caching
      const urlWithJitter = url + (url.includes('?') ? '&' : '?') + '_=' + Date.now();
      
      return new Promise((resolve, reject) => {
        $.ajax({
          url: urlWithJitter,
          method: method,
          data: data,
          timeout: AJAX_TIMEOUT,
          headers: {
            // Add randomized headers to appear more like a real browser
            'Accept-Language': 'en-US,en;q=0.9',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'X-Requested-With': 'XMLHttpRequest'
          },
          beforeSend: function(xhr) {
            // Add a referer that matches the site
            xhr.setRequestHeader('Referer', url);
          },
          success: response => resolve(response),
          error: xhr => reject(xhr)
        });
      });
    }
  
    const webfileId = "BGDDV1CCB425";
    const name = "ANANDA KUMAR PAUL";
    const email = "ANANDAKUMARPAUL1967@GMAIL.COM";
    const phoneNumber = "01335442813";
  
    const webfileId_1 = "BGDDV1EAEC25";
    const webfileId_1_name = "ASHA RANI DUTTA";
    const webfileId_2 = "BGDDV1E74B25";
    const webfileId_2_name = "ANUSREE DUTTA";
  
    const selectedPayment = {
      name: "VISA",
      slug: "visacard",
      link: "https://securepay.sslcommerz.com/gwprocess/v4/image/gw1/visa.png",
    };
    const preTestUrl = "https://payment.ivacbd.com";
    const appInfoUrl = "https://payment.ivacbd.com/application-info-submit";
    const perInfoUrl = "https://payment.ivacbd.com/personal-info-submit";
    const overviewUrl = "https://payment.ivacbd.com/overview-submit";
    const sendOtpUrl = "https://payment.ivacbd.com/pay-otp-sent";
    const verifyOtpUrl = "https://payment.ivacbd.com/pay-otp-verify";
    const slotTimeUrl = "https://payment.ivacbd.com/pay-slot-time";
    const payNowUrl = "https://payment.ivacbd.com/paynow";
    const APPINFO_PAYLOAD = {
        _token: csrfToken,
        highcom: "1",
        webfile_id: webfileId,
        webfile_id_repeat: webfileId,
        ivac_id: "17",
        visa_type: "13",
        family_count: "0",
        visit_purpose: "For medical purpose",
      };
    const PERINFO_PAYLOAD = {
      _token: csrfToken,
      full__name: name,
      email_name: email,
      pho_ne: phoneNumber,
      web_file_id: webfileId,
      "family[1][name]": webfileId_1_name,
      "family[1][webfile_no]": webfileId_1,
      "family[1][again_webfile_no]": webfileId_1,
      "family[2][name]": webfileId_2_name,
      "family[2][webfile_no]": webfileId_2,
      "family[2][again_webfile_no]": webfileId_2,
    };
    const OVERVIEW_PAYLOAD = {
      _token: csrfToken,
    };
  
    // STEP 1: Pre-step test with rate limit awareness
    async function testPreStep() {
      console.log("Performing pre-step test on:", preTestUrl);
      
      try {
        await randomDelay();
        const response = await makeRequest(preTestUrl, "GET");
        
        if (typeof response === 'string' && response.indexOf("highcom") > -1) {
          resetRetries();
          console.log("Pre-step success: 'highcom' found. Proceeding to AppInfo.");
          await randomDelay();
          return submitAppInfo();
        } else {
          console.log("Pre-step response did not contain 'highcom'. Retrying...");
          retryAttempts++;
          setTimeout(testPreStep, getRetryDelay());
        }
      } catch (error) {
        handleError(error, testPreStep);
      }
    }
  
    // STEP 2: Submit AppInfo
    async function submitAppInfo() {
      console.log("Submitting Application Info...");
      
      try {
        await randomDelay(); 
        const response = await makeRequest(appInfoUrl, "POST", APPINFO_PAYLOAD);
        
        if (typeof response === 'string' && response.indexOf("PersonalForm") > -1) {
          resetRetries();
          console.log("AppInfo response received. Detected 'PersonalForm'. Proceeding to Personal Info.");
          await randomDelay();
          return submitPerInfo();
        } else {
          console.log("AppInfo response did not contain 'PersonalForm'. Retrying...");
          retryAttempts++;
          setTimeout(submitAppInfo, getRetryDelay());
        }
      } catch (error) {
        handleError(error, submitAppInfo);
      }
    }
  
    // STEP 3: Submit Personal Info
    async function submitPerInfo() {
      console.log("Submitting Personal Info...");
      
      try {
        await randomDelay(); 
        const response = await makeRequest(perInfoUrl, "POST", PERINFO_PAYLOAD);
        
        if (typeof response === 'string') {
          if (response.indexOf("highcom") > -1) {
            console.log("Highcom detected in Personal Info. Restarting from AppInfo step.");
            await randomDelay();
            return submitAppInfo();
          } else if (response.indexOf(webfileId) > -1) {
            resetRetries();
            console.log(`Detected webfile ID '${webfileId}' in Personal Info. Proceeding to Overview.`);
            await randomDelay();
            return submitOverview();
          }
        }
        
        console.log("Personal Info response did not meet criteria. Retrying...");
        retryAttempts++;
        setTimeout(submitPerInfo, getRetryDelay());
      } catch (error) {
        handleError(error, submitPerInfo);
      }
    }
  
    // STEP 4: Submit Overview
    async function submitOverview() {
      console.log("Submitting Overview...");
      
      try {
        await randomDelay(); 
        const response = await makeRequest(overviewUrl, "POST", OVERVIEW_PAYLOAD);
        
        if (typeof response === 'string') {
          if (response.indexOf("highcom") > -1) {
            console.log("Highcom detected in Overview. Starting from AppInfo step.");
            await randomDelay();
            return submitAppInfo();
          } else {
            resetRetries();
            console.log("Overview response received.");
            if (response.indexOf("payment-option") > -1) {
              console.log("Detected 'payment-option'. Proceeding to Payment steps.");
            } else {
              console.log("Payment-option not detected, but successful response received. Proceeding to Payment steps.");
            }
            await randomDelay();
            return sendOtp();
          }
        }
        
        console.log("Overview response was not as expected. Retrying...");
        retryAttempts++;
        setTimeout(submitOverview, getRetryDelay());
      } catch (error) {
        handleError(error, submitOverview);
      }
    }
  
    // STEP 5: Send OTP
    async function sendOtp() {
      console.log("Sending OTP...");
      const SENDOTP_PAYLOAD = {
        _token: csrfToken,
        resend: "0",
      };
      
      try {
        await randomDelay(); 
        const response = await makeRequest(sendOtpUrl, "POST", SENDOTP_PAYLOAD);
        
        if (response && response.success) {
          resetRetries();
          console.log("OTP sent successfully.", response);
          await randomDelay();
          return verifyOtp();
        } else {
          console.log("OTP send failed. Retrying...", response);
          retryAttempts++;
          setTimeout(sendOtp, getRetryDelay());
        }
      } catch (error) {
        handleError(error, sendOtp);
      }
    }
  
    // STEP 6: Verify OTP (no parallel processing since we need user input)
    async function verifyOtp() {
      const otp = prompt("Enter the OTP received (6 digits):", "");
      if (!otp || otp.length !== 6) {
        console.log("Invalid OTP input. Retrying OTP verification...");
        retryAttempts++;
        return setTimeout(verifyOtp, getRetryDelay());
      }
  
      const VERIFYOTP_PAYLOAD = { _token: csrfToken, otp: otp };
      
      try {
        await randomDelay(); 
        const response = await makeRequest(verifyOtpUrl, "POST", VERIFYOTP_PAYLOAD);
        
        if (response && response.success) {
          resetRetries();
          console.log("OTP verified successfully.", response);
          if (
            response.data &&
            response.data.slot_dates &&
            response.data.slot_dates.length > 0
          ) {
            const appointmentDate = response.data.slot_dates[0];
            console.log(
              "Using appointment date from OTP verify response:",
              appointmentDate
            );
            await randomDelay();
            return fetchSlotTime(appointmentDate);
          } else {
            console.error(
              "No slot dates found. Cannot proceed with payment without an appointment date."
            );
          }
        } else {
          console.log("OTP verification failed. Retrying...", response);
          retryAttempts++;
          setTimeout(verifyOtp, getRetryDelay());
        }
      } catch (error) {
        handleError(error, verifyOtp);
      }
    }
  
    // STEP 7: Fetch Slot Time
    async function fetchSlotTime(appointmentDate) {
      console.log("Fetching slot times for date:", appointmentDate);
      const SLOTTIME_PAYLOAD = {
        _token: csrfToken,
        appointment_date: appointmentDate,
      };
      
      try {
        await randomDelay(); 
        const response = await makeRequest(slotTimeUrl, "POST", SLOTTIME_PAYLOAD);
        
        if (response && response.success && response.data && 
            response.data.slot_times && response.data.slot_times.length > 0) {
          resetRetries();
          console.log("Slot times fetched successfully.", response);
          const appointmentTime = response.data.slot_times[0].hour;
          const newAppointmentDate = response.data.slot_dates[0];
          let siteKey = null;
          if (response.captcha) {
            const match = response.captcha.match(/data-sitekey="([^"]+)"/);
            if (match && match[1]) {
              siteKey = match[1];
              console.log(
                "Extracted siteKey from slot time response:",
                siteKey
              );
            }
          }
          await randomDelay();
          return solveCaptchaAndPay(appointmentTime, siteKey, newAppointmentDate);
        } else {
          console.log("Slot time fetch failed. Retrying...", response);
          retryAttempts++;
          setTimeout(() => fetchSlotTime(appointmentDate), getRetryDelay());
        }
      } catch (error) {
        handleError(error, () => fetchSlotTime(appointmentDate));
      }
    }
  
    // STEP 8: Solve CAPTCHA and prepare for payment
    async function solveCaptchaAndPay(appointmentTime, siteKey, appointmentDate) {
      siteKey = siteKey || "6LdOCpAqAAAAAOLNB3Vwt_H7Nw4GGCAbdYm5Brsb";
      if (recaptchaToken) {
        await randomDelay();
        return attemptPayNow(appointmentTime, recaptchaToken, appointmentDate, siteKey);
      } else {
        if (!document.getElementById("captcha-wrapper")) {
          const captchaHTML = `
            <div id="captcha-wrapper">
              <div id="captcha-content">
                <div class="g-recaptcha" id="hash-param" data-callback="setRecaptchaTokenPay" data-sitekey="${siteKey}"></div>
              </div>
            </div>
          `;
          document.body.insertAdjacentHTML("beforeend", captchaHTML);
          console.log("✅ CAPTCHA content injected.");
        }
        
        return new Promise((resolve) => {
          if (
            document.getElementById("hash-param") &&
            typeof grecaptcha !== "undefined"
          ) {
            console.log("🔄 Rendering reCAPTCHA with siteKey:", siteKey);
            grecaptcha.render("hash-param", {
              sitekey: siteKey,
              theme: "light",
              callback: async function (token) {
                recaptchaToken = token;
                console.log("✅ reCAPTCHA solved. Token received:", recaptchaToken);
                await randomDelay();
                resolve(attemptPayNow(appointmentTime, recaptchaToken, appointmentDate, siteKey));
              },
            });
          } else {
            console.log(
              "❌ 'hash-param' element not available. Retrying CAPTCHA rendering..."
            );
            retryAttempts++;
            setTimeout(
              () => {
                solveCaptchaAndPay(appointmentTime, siteKey, appointmentDate)
                  .then(resolve);
              },
              getRetryDelay()
            );
          }
        });
      }
    }
  
    // STEP 9: Attempt payment
    async function attemptPayNow(
      appointmentTime,
      captchaToken,
      appointmentDate,
      siteKey
    ) {
      console.log("Attempting PayNow with token:", captchaToken);
      const PAYNOW_PAYLOAD = {
        _token: csrfToken,
        appointment_date: appointmentDate,
        appointment_time: appointmentTime,
        hash_param: captchaToken,
        selected_payment: selectedPayment,
      };
      
      try {
        await randomDelay(); 
        const response = await makeRequest(payNowUrl, "POST", PAYNOW_PAYLOAD);
        
        if (response && response.success) {
          resetRetries();
          console.log("Payment processed successfully.", response);
          if (response.url) {
            window.location.href = response.url;
          }
        } else {
          if (
            typeof response === "string" &&
            response.indexOf("Validation failed. Please try again later") > -1
          ) {
            console.log(
              "Validation failed. Re-solving CAPTCHA and retrying PayNow..."
            );
            recaptchaToken = "";
            await randomDelay();
            return solveCaptchaAndPay(appointmentTime, siteKey, appointmentDate);
          } else {
            console.log("PayNow did not succeed. Retrying...", response);
            retryAttempts++;
            setTimeout(
              () => attemptPayNow(appointmentTime, captchaToken, appointmentDate, siteKey),
              getRetryDelay()
            );
          }
        }
      } catch (error) {
        handleError(error, () => attemptPayNow(appointmentTime, captchaToken, appointmentDate, siteKey));
      }
    }
  
    // Global callback for reCAPTCHA
    window.setRecaptchaTokenPay = function (token) {
      recaptchaToken = token;
      console.log(
        "✅ reCAPTCHA token received via global callback:",
        recaptchaToken
      );
    };
  
    // Start the process based on user input
    if (startStep === "1") {
      testPreStep();
    } else if (startStep === "2") {
      submitAppInfo();
    } else {
      console.error("Invalid input. Please enter '1' or '2'.");
    }
  })();