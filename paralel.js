(function completeProcessFlow() {
    const csrfToken = csrf_token;
    let retryAttempts = 0;
    const RETRY_DELAY_BASE = 20000;
    const MAX_RETRY_DELAY = 30000;
    let recaptchaToken = "";
    const MIN_RANDOM_DELAY = 1000;
    const MAX_RANDOM_DELAY = 3000;
    const AJAX_TIMEOUT = 150000;
    const RATE_LIMIT_DELAY = 60000; // 60 seconds delay for 429 responses
    const MAX_CONCURRENT_REQUESTS = 20; // Control parallel request count
    const startStep = prompt(
      "Enter 1 to start from pre-step test, 2 to start from AppInfo:"
    );
  
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
    }
  
    // Promise-based AJAX request with proper error handling
    function makeRequest(url, method, data = null) {
      return new Promise((resolve, reject) => {
        $.ajax({
          url: url,
          method: method,
          data: data,
          timeout: AJAX_TIMEOUT,
          success: response => resolve(response),
          error: xhr => reject(xhr)
        });
      });
    }
  
    // Execute multiple parallel requests with rate limit awareness
    async function executeParallel(requestFn, validationFn, maxConcurrent = MAX_CONCURRENT_REQUESTS) {
      const activeRequests = [];
      let successResponse = null;
      let rateLimited = false;
  
      // Create a controller to manage all parallel requests
      const controller = new AbortController();
      const signal = controller.signal;
  
      // Helper function to create a request with abort capability
      function createRequest() {
        if (signal.aborted) return Promise.reject("Aborted");
        
        return requestFn()
          .then(response => {
            if (validationFn(response)) {
              successResponse = response;
              controller.abort(); // Stop all other requests
              return { success: true, response };
            }
            return { success: false };
          })
          .catch(xhr => {
            if (xhr && xhr.status === 429 && !rateLimited) {
              rateLimited = true;
              controller.abort(); // Stop all other requests on rate limit
              return { rateLimited: true };
            }
            return { error: xhr };
          });
      }
  
      // Initialize the parallel requests
      for (let i = 0; i < maxConcurrent; i++) {
        activeRequests.push(createRequest());
      }
  
      // Wait for all requests to complete
      const results = await Promise.allSettled(activeRequests);
      
      // Check for rate limiting
      if (rateLimited) {
        console.log("Rate limit detected. Waiting 60 seconds before retrying...");
        await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
        return { rateLimited: true };
      }
  
      // Return success response if found
      if (successResponse) {
        return { success: true, response: successResponse };
      }
  
      // If no successful response, return failure
      return { success: false };
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
  
    // STEP 1: Pre-step test with parallel processing
    async function testPreStep() {
      console.log("Performing pre-step test on:", preTestUrl);
      
      try {
        const result = await executeParallel(
          () => makeRequest(preTestUrl, "GET"),
          response => typeof response === 'string' && response.indexOf("highcom") > -1
        );
  
        if (result.rateLimited) {
          return testPreStep(); // Retry after rate limit delay
        }
  
        if (result.success) {
          resetRetries();
          console.log("Pre-step success: 'highcom' found. Proceeding to AppInfo.");
          await randomDelay();
          return submitAppInfo();
        } else {
          retryAttempts++;
          console.log("All pre-step attempts failed. Retrying pre-step...");
          setTimeout(testPreStep, getRetryDelay());
        }
      } catch (error) {
        retryAttempts++;
        console.error("Error in pre-step:", error);
        setTimeout(testPreStep, getRetryDelay());
      }
    }
  
    // STEP 2: Submit AppInfo with parallel processing
    async function submitAppInfo() {
      console.log("Submitting Application Info...");
      
      try {
        const result = await executeParallel(
          () => makeRequest(appInfoUrl, "POST", APPINFO_PAYLOAD),
          response => typeof response === 'string' && response.indexOf("PersonalForm") > -1
        );
  
        if (result.rateLimited) {
          return submitAppInfo(); // Retry after rate limit delay
        }
  
        if (result.success) {
          resetRetries();
          console.log("AppInfo response received. Detected 'PersonalForm'. Proceeding to Personal Info.");
          await randomDelay();
          return submitPerInfo();
        } else {
          retryAttempts++;
          console.log("AppInfo submission failed. Retrying...");
          setTimeout(submitAppInfo, getRetryDelay());
        }
      } catch (error) {
        retryAttempts++;
        console.error("Error in AppInfo submission:", error);
        setTimeout(submitAppInfo, getRetryDelay());
      }
    }
  
    // STEP 3: Submit Personal Info with parallel processing
    async function submitPerInfo() {
      console.log("Submitting Personal Info...");
      
      try {
        const result = await executeParallel(
          () => makeRequest(perInfoUrl, "POST", PERINFO_PAYLOAD),
          response => {
            if (typeof response === 'string') {
              if (response.indexOf("highcom") > -1) {
                console.log("Highcom detected in Personal Info. Restarting from AppInfo step.");
                setTimeout(submitAppInfo, getRetryDelay());
                return false; // Not a success but special handling
              }
              return response.indexOf(webfileId) > -1;
            }
            return false;
          }
        );
  
        if (result.rateLimited) {
          return submitPerInfo(); // Retry after rate limit delay
        }
  
        if (result.success) {
          resetRetries();
          console.log(`Detected webfile ID '${webfileId}' in Personal Info. Proceeding to Overview.`);
          await randomDelay();
          return submitOverview();
        } else {
          retryAttempts++;
          console.log("Personal Info submission failed. Retrying...");
          setTimeout(submitPerInfo, getRetryDelay());
        }
      } catch (error) {
        retryAttempts++;
        console.error("Error in Personal Info submission:", error);
        setTimeout(submitPerInfo, getRetryDelay());
      }
    }
  
    // STEP 4: Submit Overview with parallel processing
    async function submitOverview() {
      console.log("Submitting Overview...");
      
      try {
        const result = await executeParallel(
          () => makeRequest(overviewUrl, "POST", OVERVIEW_PAYLOAD),
          response => {
            if (typeof response === 'string') {
              if (response.indexOf("highcom") > -1) {
                console.log("Highcom detected in Overview. Starting from AppInfo step.");
                setTimeout(submitAppInfo, getRetryDelay());
                return false; // Not a success but special handling
              }
              return true; // Any response that's not a restart case is considered success
            }
            return false;
          }
        );
  
        if (result.rateLimited) {
          return submitOverview(); // Retry after rate limit delay
        }
  
        if (result.success) {
          resetRetries();
          console.log("Overview response received.");
          if (typeof result.response === 'string' && result.response.indexOf("payment-option") > -1) {
            console.log("Detected 'payment-option'. Proceeding to Payment steps.");
          } else {
            console.log("Payment-option not detected, but successful response received. Proceeding to Payment steps.");
          }
          await randomDelay();
          return sendOtp();
        } else {
          retryAttempts++;
          console.log("Overview submission failed. Retrying...");
          setTimeout(submitOverview, getRetryDelay());
        }
      } catch (error) {
        retryAttempts++;
        console.error("Error in Overview submission:", error);
        setTimeout(submitOverview, getRetryDelay());
      }
    }
  
    // STEP 5: Send OTP with parallel processing
    async function sendOtp() {
      console.log("Sending OTP...");
      const SENDOTP_PAYLOAD = {
        _token: csrfToken,
        resend: "0",
      };
      
      try {
        const result = await executeParallel(
          () => makeRequest(sendOtpUrl, "POST", SENDOTP_PAYLOAD),
          response => response && response.success === true
        );
  
        if (result.rateLimited) {
          return sendOtp(); // Retry after rate limit delay
        }
  
        if (result.success) {
          resetRetries();
          console.log("OTP sent successfully.", result.response);
          await randomDelay();
          return verifyOtp();
        } else {
          retryAttempts++;
          console.log("OTP send failed. Retrying...");
          setTimeout(sendOtp, getRetryDelay());
        }
      } catch (error) {
        retryAttempts++;
        console.error("Error sending OTP:", error);
        setTimeout(sendOtp, getRetryDelay());
      }
    }
  
    // STEP 6: Verify OTP (no parallel processing here since we need user input)
    async function verifyOtp() {
      const otp = prompt("Enter the OTP received (6 digits):", "");
      if (!otp || otp.length !== 6) {
        console.log("Invalid OTP input. Retrying OTP verification...");
        retryAttempts++;
        return setTimeout(verifyOtp, getRetryDelay());
      }
  
      const VERIFYOTP_PAYLOAD = { _token: csrfToken, otp: otp };
      
      try {
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
      } catch (xhr) {
        if (xhr.status === 429) {
          console.log("Rate limit (429) detected. Waiting 60 seconds before retrying OTP verification...");
          setTimeout(verifyOtp, RATE_LIMIT_DELAY);
        } else {
          retryAttempts++;
          console.error(
            "Error verifying OTP. Retrying...",
            xhr.responseText || xhr.statusText
          );
          setTimeout(verifyOtp, getRetryDelay());
        }
      }
    }
  
    // STEP 7: Fetch Slot Time with parallel processing
    async function fetchSlotTime(appointmentDate) {
      console.log("Fetching slot times for date:", appointmentDate);
      const SLOTTIME_PAYLOAD = {
        _token: csrfToken,
        appointment_date: appointmentDate,
      };
      
      try {
        const result = await executeParallel(
          () => makeRequest(slotTimeUrl, "POST", SLOTTIME_PAYLOAD),
          response => response && 
            response.success && 
            response.data && 
            response.data.slot_times && 
            response.data.slot_times.length > 0
        );
  
        if (result.rateLimited) {
          return fetchSlotTime(appointmentDate); // Retry after rate limit delay
        }
  
        if (result.success) {
          resetRetries();
          console.log("Slot times fetched successfully.", result.response);
          const response = result.response;
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
          retryAttempts++;
          console.log("Slot time fetch failed. Retrying...");
          setTimeout(() => fetchSlotTime(appointmentDate), getRetryDelay());
        }
      } catch (error) {
        retryAttempts++;
        console.error("Error fetching slot time:", error);
        setTimeout(() => fetchSlotTime(appointmentDate), getRetryDelay());
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
  
    // STEP 9: Attempt payment with parallel processing
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
        const result = await executeParallel(
          () => makeRequest(payNowUrl, "POST", PAYNOW_PAYLOAD),
          response => response && response.success
        );
  
        if (result.rateLimited) {
          return attemptPayNow(appointmentTime, captchaToken, appointmentDate, siteKey); // Retry after rate limit delay
        }
  
        if (result.success) {
          resetRetries();
          console.log("Payment processed successfully.", result.response);
          if (result.response.url) {
            window.location.href = result.response.url;
          }
        } else {
          if (
            typeof result.response === "string" &&
            result.response.indexOf("Validation failed. Please try again later") > -1
          ) {
            console.log(
              "Validation failed. Re-solving CAPTCHA and retrying PayNow..."
            );
            recaptchaToken = "";
            await randomDelay();
            return solveCaptchaAndPay(appointmentTime, siteKey, appointmentDate);
          } else {
            retryAttempts++;
            console.log("PayNow did not succeed. Retrying...", result.response);
            setTimeout(
              () => attemptPayNow(appointmentTime, captchaToken, appointmentDate, siteKey),
              getRetryDelay()
            );
          }
        }
      } catch (error) {
        retryAttempts++;
        console.error("Error processing payment:", error);
        setTimeout(
          () => attemptPayNow(appointmentTime, captchaToken, appointmentDate, siteKey),
          getRetryDelay()
        );
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