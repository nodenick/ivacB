(function completeProcessFlow() {
  const csrfToken = csrf_token;
  let retryAttempts = 0;
  const RETRY_DELAY_BASE = 200;
  const MAX_RETRY_DELAY = 1000;
  let recaptchaToken = "";
  const MIN_RANDOM_DELAY = 100;
  const MAX_RANDOM_DELAY = 500;
  const AJAX_TIMEOUT = 150000;
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

  function randomDelay(fn) {
    const delay = Math.floor(
      Math.random() * (MAX_RANDOM_DELAY - MIN_RANDOM_DELAY) + MIN_RANDOM_DELAY
    );
    setTimeout(fn, delay);
  }

  function resetRetries() {
    retryAttempts = 0;
  }

  const webfileId = "BGDRV1E6A725";
  const name = "MD RASHEDUL ISLAM";
  const email = "parosh.cse@gmail.com";
  const phoneNumber = "01766283131";

  const webfileId_1 = "BGDDV175B225";
  const webfileId_1_name = "IFFAT HASAN";
  const webfileId_2 = "BGDDV1756825";
  const webfileId_2_name = "NUSRAT HASAN JANNAT";

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
    visit_purpose: "For higher study",
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

  function testPreStep() {
    console.log("Performing pre-step test on:", preTestUrl);
    $.ajax({
      url: preTestUrl,
      method: "GET",
      timeout: AJAX_TIMEOUT,
      success: function (response) {
        resetRetries();
        if (response.indexOf("highcom") > -1) {
          console.log(
            "Pre-step success: 'highcom' found. Proceeding to AppInfo."
          );
          randomDelay(submitAppInfo);
        } else {
          console.log("'highcom' not found. Retrying pre-step...");
          retryAttempts++;
          setTimeout(testPreStep, getRetryDelay());
        }
      },
      error: function (xhr) {
        retryAttempts++;
        console.error(
          "Error during pre-step test. Retrying...",
          xhr.responseText || xhr.statusText
        );
        setTimeout(testPreStep, getRetryDelay());
      },
    });
  }

  function submitAppInfo() {
    console.log("Submitting Application Info...");
    $.ajax({
      url: appInfoUrl,
      method: "POST",
      data: APPINFO_PAYLOAD,
      timeout: AJAX_TIMEOUT,
      success: function (response) {
        resetRetries();
        console.log("AppInfo response received.");
        if (response.indexOf("PersonalForm") > -1) {
          console.log("Detected 'PersonalForm'. Proceeding to Personal Info.");
          randomDelay(submitPerInfo);
        } else {
          console.log("'PersonalForm' not detected. Retrying AppInfo...");
          retryAttempts++;
          setTimeout(submitAppInfo, getRetryDelay());
        }
      },
      error: function (xhr) {
        retryAttempts++;
        console.error(
          "Error submitting AppInfo. Retrying...",
          xhr.responseText || xhr.statusText
        );
        setTimeout(submitAppInfo, getRetryDelay());
      },
    });
  }

  function submitPerInfo() {
    console.log("Submitting Personal Info...");
    $.ajax({
      url: perInfoUrl,
      method: "POST",
      data: PERINFO_PAYLOAD,
      timeout: AJAX_TIMEOUT,
      success: function (response) {
        resetRetries();
        console.log("Personal Info response received.");
        // Check if the response has "highcom". If so, restart from AppInfo.
        if (response.indexOf("highcom") > -1) {
          console.log("Highcom detected. Restarting from AppInfo step.");
          randomDelay(submitAppInfo);
        }
        // Otherwise, check if the expected webfileId is present.
        else if (response.indexOf(webfileId) > -1) {
          console.log(
            `Detected webfile ID '${webfileId}' in Personal Info. Proceeding to Overview.`
          );
          randomDelay(submitOverview);
        } else {
          console.log(
            `Webfile ID '${webfileId}' not found. Retrying Personal Info...`
          );
          retryAttempts++;
          setTimeout(submitPerInfo, getRetryDelay());
        }
      },
      error: function (xhr) {
        retryAttempts++;
        console.error(
          "Error submitting Personal Info. Retrying...",
          xhr.responseText || xhr.statusText
        );
        setTimeout(submitPerInfo, getRetryDelay());
      },
    });
  }

  function submitOverview() {
    console.log("Submitting Overview...");
    $.ajax({
      url: overviewUrl,
      method: "POST",
      data: OVERVIEW_PAYLOAD,
      timeout: AJAX_TIMEOUT,
      success: function (response) {
        resetRetries();
        console.log("Overview response received.");
        // If "highcom" is detected, restart from AppInfo.
        if (response.indexOf("highcom") > -1) {
          console.log("Highcom detected. Starting from AppInfo step.");
          randomDelay(submitAppInfo);
        } else {
          // Whether or not "payment-option" is detected, proceed to the next step.
          if (response.indexOf("payment-option") > -1) {
            console.log(
              "Detected 'payment-option'. Proceeding to Payment steps."
            );
          } else {
            console.log(
              "Payment-option not detected, but successful response received. Proceeding to Payment steps."
            );
          }
          randomDelay(sendOtp);
        }
      },
      error: function (xhr) {
        retryAttempts++;
        console.error(
          "Error submitting Overview. Retrying...",
          xhr.responseText || xhr.statusText
        );
        setTimeout(submitOverview, getRetryDelay());
      },
    });
  }

  function sendOtp() {
    console.log("Sending OTP...");
    const SENDOTP_PAYLOAD = {
      _token: csrfToken,
      resend: "0",
    };

    $.ajax({
      url: sendOtpUrl,
      method: "POST",
      data: SENDOTP_PAYLOAD,
      timeout: AJAX_TIMEOUT,
      success: function (response) {
        resetRetries();
        if (response.success) {
          console.log("OTP sent successfully.", response);
          randomDelay(verifyOtp);
        } else {
          console.log("OTP send failed. Retrying...", response);
          retryAttempts++;
          setTimeout(sendOtp, getRetryDelay());
        }
      },
      error: function (xhr) {
        retryAttempts++;
        console.error(
          "Error sending OTP. Retrying...",
          xhr.responseText || xhr.statusText
        );
        setTimeout(sendOtp, getRetryDelay());
      },
    });
  }

  function verifyOtp() {
    const otp = prompt("Enter the OTP received (6 digits):", "");
    if (!otp || otp.length !== 6) {
      console.log("Invalid OTP input. Retrying OTP verification...");
      retryAttempts++;
      return setTimeout(verifyOtp, getRetryDelay());
    }

    const VERIFYOTP_PAYLOAD = { _token: csrfToken, otp: otp };
    $.ajax({
      url: verifyOtpUrl,
      method: "POST",
      data: VERIFYOTP_PAYLOAD,
      timeout: AJAX_TIMEOUT,
      success: function (response) {
        if (response.success) {
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
            randomDelay(() => fetchSlotTime(appointmentDate));
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
      },
      error: function (xhr) {
        retryAttempts++;
        console.error(
          "Error verifying OTP. Retrying...",
          xhr.responseText || xhr.statusText
        );
        setTimeout(verifyOtp, getRetryDelay());
      },
    });
  }

  function fetchSlotTime(appointmentDate) {
    console.log("Fetching slot times for date:", appointmentDate);
    const SLOTTIME_PAYLOAD = {
      _token: csrfToken,
      appointment_date: appointmentDate,
    };

    $.ajax({
      url: slotTimeUrl,
      method: "POST",
      data: SLOTTIME_PAYLOAD,
      timeout: AJAX_TIMEOUT,
      success: function (response) {
        resetRetries();
        if (
          response.success &&
          response.data &&
          response.data.slot_times &&
          response.data.slot_times.length > 0
        ) {
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
          randomDelay(() =>
            solveCaptchaAndPay(appointmentTime, siteKey, newAppointmentDate)
          );
        } else {
          console.log("Slot time fetch failed. Retrying...", response);
          retryAttempts++;
          setTimeout(() => fetchSlotTime(appointmentDate), getRetryDelay());
        }
      },
      error: function (xhr) {
        retryAttempts++;
        console.error(
          "Error fetching slot time. Retrying...",
          xhr.responseText || xhr.statusText
        );
        setTimeout(() => fetchSlotTime(appointmentDate), getRetryDelay());
      },
    });
  }

  function solveCaptchaAndPay(appointmentTime, siteKey, appointmentDate) {
    siteKey = siteKey || "6LdOCpAqAAAAAOLNB3Vwt_H7Nw4GGCAbdYm5Brsb";
    if (recaptchaToken) {
      randomDelay(() =>
        attemptPayNow(appointmentTime, recaptchaToken, appointmentDate, siteKey)
      );
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
      if (
        document.getElementById("hash-param") &&
        typeof grecaptcha !== "undefined"
      ) {
        console.log("🔄 Rendering reCAPTCHA with siteKey:", siteKey);
        grecaptcha.render("hash-param", {
          sitekey: siteKey,
          theme: "light",
          callback: function (token) {
            recaptchaToken = token;
            console.log("✅ reCAPTCHA solved. Token received:", recaptchaToken);
            randomDelay(() =>
              attemptPayNow(
                appointmentTime,
                recaptchaToken,
                appointmentDate,
                siteKey
              )
            );
          },
        });
      } else {
        console.log(
          "❌ 'hash-param' element not available. Retrying CAPTCHA rendering..."
        );
        retryAttempts++;
        setTimeout(
          () => solveCaptchaAndPay(appointmentTime, siteKey, appointmentDate),
          getRetryDelay()
        );
      }
    }
  }

  function attemptPayNow(
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

    $.ajax({
      url: payNowUrl,
      method: "POST",
      data: PAYNOW_PAYLOAD,
      timeout: AJAX_TIMEOUT,
      success: function (response) {
        resetRetries();
        console.log("PayNow response:", response);
        if (response.success) {
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
            randomDelay(() =>
              solveCaptchaAndPay(appointmentTime, siteKey, appointmentDate)
            );
          } else {
            console.log("PayNow did not succeed. Retrying...", response);
            retryAttempts++;
            setTimeout(
              () =>
                attemptPayNow(
                  appointmentTime,
                  captchaToken,
                  appointmentDate,
                  siteKey
                ),
              getRetryDelay()
            );
          }
        }
      },
      error: function (xhr) {
        retryAttempts++;
        console.error(
          "Error processing payment. Retrying...",
          xhr.responseText || xhr.statusText
        );
        setTimeout(
          () =>
            attemptPayNow(
              appointmentTime,
              captchaToken,
              appointmentDate,
              siteKey
            ),
          getRetryDelay()
        );
      },
    });
  }

  window.setRecaptchaTokenPay = function (token) {
    recaptchaToken = token;
    console.log(
      "✅ reCAPTCHA token received via global callback:",
      recaptchaToken
    );
  };

  if (startStep === "1") {
    testPreStep();
  } else if (startStep === "2") {
    submitAppInfo();
  } else {
    console.error("Invalid input. Please enter '1' or '2'.");
  }
})();
