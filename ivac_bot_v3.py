import requests
import time
import random
import datetime
import json
import os
import sys
import logging
import threading
import socket
from threading import Thread, Event, Lock
from queue import Queue
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright
from python_anticaptcha import AnticaptchaClient
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
import multiprocessing
from multiprocessing import Manager
from requests.cookies import RequestsCookieJar, create_cookie
# Setup logging with a custom formatter that doesn't interfere with input prompts
PROXY_LIST = [
    {
        "server": "http://proxy.oculus-proxy.com:31111",
        "username": "oc-3afdad8d09f585f344baa490b91a86f4c853de37421e821eae25bec242bfb64b-country-BD-session-2fb63d",
        "password": "m15f414wugcn"
    },
    {
        "server": "http://proxy.oculus-proxy.com:31111",
        "username": "oc-94ac51827433836811244e4ae1e163fc58f057bf144e6ccb8123b37aedb6f086-country-BD-session-75c01",
        "password": "ng47nvdi2jw9"
    },
    {
        "server": "http://proxy.oculus-proxy.com:31111",
        "username": "oc-94ac51827433836811244e4ae1e163fc58f057bf144e6ccb8123b37aedb6f086-country-BD-session-20048",
        "password": "ng47nvdi2jw9"
    },
    {
        "server": "http://proxy.oculus-proxy.com:31111",
        "username": "oc-94ac51827433836811244e4ae1e163fc58f057bf144e6ccb8123b37aedb6f086-country-BD-session-2fc80",
        "password": "ng47nvdi2jw9"
    },
    {
        "server": "http://proxy.oculus-proxy.com:31111",
        "username": "oc-94ac51827433836811244e4ae1e163fc58f057bf144e6ccb8123b37aedb6f086-country-BD-session-e4960",
        "password": "ng47nvdi2jw9"
    },
    {
        "server": "http://proxy.oculus-proxy.com:31111",
        "username": "oc-94ac51827433836811244e4ae1e163fc58f057bf144e6ccb8123b37aedb6f086-country-BD-session-b1e88",
        "password": "ng47nvdi2jw9"
    },
    {
        "server": "http://proxy.oculus-proxy.com:31111",
        "username": "oc-3afdad8d09f585f344baa490b91a86f4c853de37421e821eae25bec242bfb64b-country-BD-session-ff5c6",
        "password": "m15f414wugcn"
    },
    {
        "server": "http://proxy.oculus-proxy.com:31111",
        "username": "oc-3afdad8d09f585f344baa490b91a86f4c853de37421e821eae25bec242bfb64b-country-BD-session-a3468",
        "password": "m15f414wugcn"
    },
    {
        "server": "http://proxy.oculus-proxy.com:31111",
        "username": "oc-3afdad8d09f585f344baa490b91a86f4c853de37421e821eae25bec242bfb64b-country-BD-session-533bf",
        "password": "m15f414wugcn"
    },
    {
        "server": "http://proxy.oculus-proxy.com:31111",
        "username": "oc-3afdad8d09f585f344baa490b91a86f4c853de37421e821eae25bec242bfb64b-country-BD-session-1cb4d",
        "password": "m15f414wugcn"
    },
    {
        "server": "http://proxy.oculus-proxy.com:31111",
        "username": "oc-3afdad8d09f585f344baa490b91a86f4c853de37421e821eae25bec242bfb64b-country-BD-session-d4d13",
        "password": "m15f414wugcn"
    },
    {
        "server": "http://proxy.oculus-proxy.com:31111",
        "username": "oc-3afdad8d09f585f344baa490b91a86f4c853de37421e821eae25bec242bfb64b-country-BD-session-fa0a4",
        "password": "m15f414wugcn"
    },
    {
        "server": "http://proxy.oculus-proxy.com:31111",
        "username": "oc-3afdad8d09f585f344baa490b91a86f4c853de37421e821eae25bec242bfb64b-country-BD-session-42067",
        "password": "m15f414wugcn"
    },
    {
        "server": "http://proxy.oculus-proxy.com:31111",
        "username": "oc-3afdad8d09f585f344baa490b91a86f4c853de37421e821eae25bec242bfb64b-country-BD-session-587b3",
        "password": "m15f414wugcn"
    },
    {
        "server": "http://proxy.oculus-proxy.com:31111",
        "username": "oc-3afdad8d09f585f344baa490b91a86f4c853de37421e821eae25bec242bfb64b-country-BD-session-c8b6e",
        "password": "m15f414wugcn"
    },
    {
        "server": "http://proxy.oculus-proxy.com:31111",
        "username": "oc-3afdad8d09f585f344baa490b91a86f4c853de37421e821eae25bec242bfb64b-country-BD-session-73e76",
        "password": "m15f414wugcn"
    }
]


class InputFriendlyFormatter(logging.Formatter):
    def format(self, record):
        formatted = super().format(record)
        # Add a carriage return before each log message so it doesn't mix with input prompts
        return '\n' + formatted if record.levelno != logging.CRITICAL else formatted


# Setup logging
logging.basicConfig(
    level=logging.INFO,
    handlers=[
        logging.FileHandler("ivac_bot.log"),
        logging.StreamHandler(sys.stdout)
    ]
)

# Apply custom formatter to all handlers
formatter = InputFriendlyFormatter(
    '%(asctime)s - %(name)s - %(levelname)s - %(message)s')
for handler in logging.root.handlers:
    handler.setFormatter(formatter)

logger = logging.getLogger("IVACBot")

# Create a special logger for critical messages like OTP prompts
input_logger = logging.getLogger("InputPrompt")
input_handler = logging.StreamHandler(sys.stdout)
input_handler.setLevel(logging.CRITICAL)
input_handler.setFormatter(logging.Formatter('%(message)s'))
input_logger.addHandler(input_handler)
input_logger.setLevel(logging.CRITICAL)

# Input lock to prevent interference from other threads
input_lock = Lock()

# User configuration - will be loaded from JSON file
DEFAULT_CONFIG = {
    "anticaptcha_key": "b2d948fa28e6e7b6b3a7db19b6fc1708",
    "headless": False,
    "cf_timeout": 120,
    "booking_start_time": "19:00:00",  # 4:00 PM
    "login_preparation_time": "00:01:00",  # 3:30 PM
    "max_retries": 20,
    "retry_delay": 3,
    "monitor_interval": 30,  # Seconds between progress reports
    "otp_socket_port": 9000,  # Port for OTP socket listener
    "users": [
        {
            "phone": "01811100656",
            "password": "R12345",
            "webfile_id": "BGDDV1CCB425",
            "full_name": "Onirudda Islam",
            "email": "email@example.com",
            "visa_type": "13",
            "highcom": "1",
            "ivac_id": "17",
            "family_count": "0",
            "visit_purpose": "For medical purpose",
            "appointment_date": "2025-04-20",
            "appointment_time": "10:00 AM",
            "payment_method": "visacard",
            "proxy_index": 0,
            "use_proxies": True
        }
    ],
    "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
}


# Socket OTP Listener Class


class OTPSocketListener:
    def __init__(self, port=9000, host='127.0.0.1'):
        """Initialize the OTP socket client"""
        self.port = port
        self.host = host
        self.otp_store = {}  # Dictionary to store OTPs by mobile number
        self.lock = Lock()  # Thread safety for the OTP store
        self.running = False
        self.thread = None
        self.logger = logging.getLogger("OTPListener")
        self.poll_interval = 2  # Seconds between polling attempts

    def log(self, message, level="info"):
        """Centralized logging for OTP listener"""
        if level == "info":
            self.logger.info(message)
        elif level == "error":
            self.logger.error(message)
        elif level == "warning":
            self.logger.warning(message)
        elif level == "debug":
            self.logger.debug(message)

    def start(self):
        """Start the OTP polling thread"""
        if self.running:
            self.log("OTP listener already running")
            return

        self.running = True
        self.thread = threading.Thread(target=self._poll_server)
        self.thread.daemon = True
        self.thread.start()
        self.log(f"OTP client started, polling {self.host}:{self.port}")

    def stop(self):
        """Stop the OTP polling thread"""
        if not self.running:
            return

        self.running = False
        if self.thread:
            self.thread.join(timeout=5)
        self.log("OTP client stopped")

    def _poll_server(self):
        """Continuously poll the OTP server for new OTPs"""
        while self.running:
            try:
                self._connect_and_get_otp()
            except Exception as e:
                self.log(f"Error polling OTP server: {str(e)}", "error")

            # Wait before next poll
            time.sleep(self.poll_interval)

    def _connect_and_get_otp(self):
        """Connect to the OTP server and retrieve any available OTPs"""
        try:
            # Create a new socket connection
            client_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            # 10 second timeout for connection and receiving
            client_socket.settimeout(10)

            # Connect to the server
            self.log(
                f"Connecting to OTP server at {self.host}:{self.port}...", "debug")
            client_socket.connect((self.host, self.port))

            # Wait for data from the server
            data = client_socket.recv(1024).decode('utf-8').strip()

            if data:
                self.log(f"Received data from server: {data}")

                # Try to parse the data as JSON
                try:
                    otp_data = json.loads(data)
                    mobile_no = str(otp_data.get('mobile_no', '')).strip()
                    otp_code = str(otp_data.get('otp', '')).strip()

                    if mobile_no and otp_code:
                        self._store_otp(mobile_no, otp_code)
                        # Send acknowledgment to server
                        client_socket.sendall(b"OTP received successfully")
                        self.log(
                            f"Stored OTP for {mobile_no}: {otp_code[:2]}**...")
                    else:
                        self.log(
                            "Missing mobile_no or otp in server response", "warning")
                except json.JSONDecodeError:
                    self.log(f"Invalid JSON data received: {data}", "warning")

        except socket.timeout:
            self.log("Connection timed out - no new OTPs available", "debug")
        except socket.error as e:
            if self.running:  # Only log if we're not deliberately stopping
                self.log(f"Socket error: {str(e)}", "error")
        except Exception as e:
            self.log(f"Unexpected error: {str(e)}", "error")
        finally:
            # Always close the socket
            try:
                client_socket.close()
            except:
                pass

    def _store_otp(self, mobile_no, otp):
        """Store OTP in the dictionary with thread safety"""
        with self.lock:
            # Store both with and without leading zero for flexibility
            self.otp_store[mobile_no] = otp

            # Also store without leading zero if present
            if mobile_no.startswith('0'):
                self.otp_store[mobile_no[1:]] = otp

            self.log(
                f"Current OTP store: {list(self.otp_store.keys())}", "debug")

    def get_otp(self, mobile_no, timeout=60):
        """
        Get OTP for a mobile number with timeout
        Returns the OTP if found within timeout, or None
        """
        start_time = time.time()
        normalized_mobile = mobile_no.lstrip('0')  # Try without leading zero

        while time.time() - start_time < timeout:
            with self.lock:
                # Check if we have the OTP for the exact mobile number
                print(f"OTP Store: {self.otp_store}")
                if mobile_no in self.otp_store:
                    otp = self.otp_store[mobile_no]
                    del self.otp_store[mobile_no]
                    self.log(f"Retrieved OTP for {mobile_no}: {otp[:2]}**...")
                    return otp

                # Check with normalized mobile number (without leading zero)
                if normalized_mobile in self.otp_store:
                    otp = self.otp_store[normalized_mobile]
                    del self.otp_store[normalized_mobile]
                    self.log(
                        f"Retrieved normalized OTP for {mobile_no}: {otp[:2]}**...")
                    return otp

            # Sleep briefly to prevent high CPU usage
            time.sleep(0.5)

        self.log(f"No OTP found for {mobile_no} within timeout", "warning")
        return None


class IVACBot:
    def __init__(self, user_config, shared_state=None, bot_id=0, otp_listener=None):
        """Initialize the IVAC bot with configuration and shared state"""
        self.session = requests.Session()
        self.csrf_token = None
        self.user_config = user_config
        self.captcha_solver = AnticaptchaClient(
            DEFAULT_CONFIG['anticaptcha_key'])
        self.shared_state = shared_state
        self.bot_id = bot_id
        self.stop_event = Event()
        self.ready_event = Event()
        self.current_stage = "initialized"
        self.logger = logging.getLogger(f"IVACBot-{bot_id}")
        self.otp_listener = otp_listener
        self.proxy = None
        if user_config.get('use_proxies', False):  # Changed from DEFAULT_CONFIG
            proxy_index = user_config.get(
                'proxy_index', bot_id) % len(PROXY_LIST)
            self.proxy = PROXY_LIST[proxy_index]
            self._configure_proxy()
            self.log(f"Using proxy: {self.proxy}...{self.proxy}")
        self.base_url = "https://payment.ivacbd.com"
        self.urls = {
            "app_info": f"{self.base_url}/application-info-submit",
            "personal_info": f"{self.base_url}/personal-info-submit",
            "overview": f"{self.base_url}/overview-submit",
            "send_otp": f"{self.base_url}/pay-otp-sent",
            "verify_otp": f"{self.base_url}/pay-otp-verify",
            "slot_time": f"{self.base_url}/pay-slot-time",
            "paynow": f"{self.base_url}/paynow"
        }
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': DEFAULT_CONFIG['user_agent'],
            'Accept-Language': 'en-US,en;q=0.9',
            'Referer': 'https://payment.ivacbd.com/'
        })

        # Add cookie persistence
        self.cookie_jar = RequestsCookieJar()
        self.session.cookies = self.cookie_jar

    def _configure_proxy(self):
        """Configure proxy for both requests and playwright"""
        if self.proxy:
            server = self.proxy['server']
            username = self.proxy['username']
            password = self.proxy['password']

            host_port = server.split('//')[1]
            proxy_url = f"http://{username}:{password}@{host_port}"
            self.session.proxies = {
                'http': proxy_url,
                'https': proxy_url
            }

            self.playwright_proxy = {
                "server": server,
                "username": username,
                "password": password,
                "bypass": "localhost"
            }
            self.log(f"Configured proxy: {server} with credentials")
        else:
            self.playwright_proxy = None

    def log(self, message, level="info"):
        """Centralized logging with bot ID"""
        log_message = f"[Bot {self.bot_id}] {message}"
        if level == "info":
            self.logger.info(log_message)
        elif level == "error":
            self.logger.error(log_message)
        elif level == "warning":
            self.logger.warning(log_message)
        elif level == "debug":
            self.logger.debug(log_message)

    def update_state(self, stage, details=None):
        """Update the shared state with current progress"""
        if self.shared_state is not None:
            self.shared_state[self.bot_id] = {
                "stage": stage,
                "details": details or {},
                "last_updated": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "user_id": self.user_config.get("phone", "unknown")
            }
        self.current_stage = stage
        self.log(f"Updated state to: {stage}")

    def wait_until(self, target_time_str):
        """Wait until the specified time"""
        now = datetime.datetime.now()
        target_time = datetime.datetime.strptime(
            target_time_str, "%H:%M:%S").time()
        target_datetime = datetime.datetime.combine(now.date(), target_time)

        # If target time is already passed for today, we don't need to wait
        if now.time() >= target_time:
            self.log(
                f"Target time {target_time_str} already passed, proceeding immediately")
            return

        wait_seconds = (target_datetime - now).total_seconds()
        self.log(
            f"Waiting for {wait_seconds:.2f} seconds until {target_time_str}")

        # Wait with cancellation support
        start_time = time.time()
        while time.time() - start_time < wait_seconds:
            if self.stop_event.is_set():
                self.log("Wait interrupted by stop event")
                return
            time.sleep(0.5)

        self.log(f"Wait completed, target time {target_time_str} reached")

    def secure_input(self, prompt):
        """Thread-safe input function with OTP socket integration"""
        # Check if this is an OTP prompt and we have an OTP listener
        if "Enter OTP" in prompt and self.otp_listener:
            mobile_no = self.user_config.get("phone")
            self.log(f"Waiting for OTP via socket for {mobile_no}...")

            # Try to get OTP from socket listener
            otp = self.otp_listener.get_otp(mobile_no=mobile_no, timeout=60)

            if otp:
                self.log(
                    f"Received OTP from socket for {mobile_no}: {otp[:2]}**...")
                return otp

            self.log("No OTP received via socket, falling back to manual input")

        # Use the original manual input method
        with input_lock:
            # Use the special logger for input prompts to avoid formatting issues
            input_logger.critical(prompt)
            # Now wait for input
            return input()

    def _show_browser_prompt(self, page):
        """Display browser dialog for OTP input (headful mode only)"""
        try:
            otp = page.evaluate('''() => {
                return prompt('Enter OTP received on your registered mobile:');
            }''')
            return otp
        except Exception as e:
            self.log(f"Browser prompt failed: {str(e)}", "warning")
            return None

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    def solve_recaptcha(self, site_key, page_url):
        """Solve reCAPTCHA v2"""
        self.log("Solving reCAPTCHA...")
        task = self.captcha_solver.create_task(
            website_url=page_url,
            website_key=site_key
        )
        task.join()
        return task.get_solution_response()

    def handle_video_modal(self, page):
        """Handle YouTube video modal with delayed close"""
        try:
            # Wait for modal to appear
            page.wait_for_selector('#instructModal', timeout=20000)
            self.log("Video modal appeared, waiting for 4 seconds...")

            # Wait for mandatory 4 seconds
            page.wait_for_timeout(4000)

            # Try different close button selectors
            close_selectors = [
                '#emergencyNoticeCloseBtn',
                'button[data-dismiss="modal"]',
                '.close'
            ]

            for selector in close_selectors:
                if page.is_visible(selector):
                    page.click(selector)
                    self.log("Closed video modal")
                    return True

            # Fallback JavaScript removal
            page.evaluate('''() => {
                document.querySelector('.modal-backdrop').remove();
                document.querySelector('#instructModal').remove();
            }''')
            self.log("Removed modal through JS fallback")
            return True

        except Exception as e:
            self.log(f"Modal handling failed: {str(e)}", "warning")
            return False

    def get_csrf_token(self, html_content):
        """Extract CSRF token from HTML"""
        soup = BeautifulSoup(html_content, 'html.parser')
        token = soup.find('input', {'name': '_token'})
        if token:
            return token['value']
        return None

    def browser_login(self):
        """Main browser automation flow with improved OTP handling"""
        self.update_state("login_started")
        self.log("Starting browser login process...")

        try:
            with sync_playwright() as p:
                browser_options = {
                    "headless": DEFAULT_CONFIG['headless'],
                    "args": [
                        '--ignore-certificate-errors',
                        "--no-sandbox",
                        "--disable-gpu",
                        "--disable-dev-shm-usage",
                        "--disable-background-networking",
                        "--disable-software-rasterizer",
                        "--disk-cache-size=0",
                        "--incognito",  # Force new session
                        "--disable-extensions",
                        "--disable-sync",
                        "--disable-site-isolation-trials",
                        "--disable-features=IsolateOrigins,site-per-process"
                    ]
                }
                browser = p.chromium.launch(**browser_options)
                context = browser.new_context(
                    user_agent=DEFAULT_CONFIG['user_agent'],
                    ignore_https_errors=True,
                    proxy=self.playwright_proxy
                )
                self.log("Browser launched with proxy configuration")
                # else:
                #     browser = p.chromium.launch(**browser_options)
                #     context = browser.new_context(
                #         user_agent=DEFAULT_CONFIG['user_agent'],
                #         ignore_https_errors=True
                #     )
                #     self.log("Browser launched without proxy")

                page = context.new_page()

                # Navigate to login page
                self.log("Navigating to payment.ivacbd.com...")
                page.goto("https://payment.ivacbd.com",
                          wait_until="networkidle",
                          timeout=DEFAULT_CONFIG['cf_timeout'] * 1000)

                # Handle video modal
                self.handle_video_modal(page)

                # Handle Cloudflare challenge
                if "challenge" in page.url:
                    self.log("Solving Cloudflare challenge...")
                    page.wait_for_selector('text="Verify you are human"',
                                           timeout=DEFAULT_CONFIG['cf_timeout'] * 1000)
                    page.wait_for_timeout(5000)

                # Login steps
                self.log(f"Entering phone number: {self.user_config['phone']}")
                page.fill(
                    'input[name="mobile_no"][maxlength="15"]', self.user_config['phone'])
                page.click('button#submitButton')

                self.log("Waiting for password field...")
                page.wait_for_selector(
                    'input[name="password"]', timeout=60000)
                page.fill('input[name="password"]',
                          self.user_config['password'])
                page.click('button#submitButton')

                self.log("Waiting for OTP field...")
                page.wait_for_selector(
                    'input[name="otp"]', timeout=60000)

                # Try to get OTP from socket listener first
                otp = None
                if self.otp_listener:
                    mobile_no = self.user_config['phone']
                    self.log(f"Requesting OTP via socket for {mobile_no}...")
                    print("OTP store inside login",
                          self.otp_listener.otp_store)
                    # print("OTP store inside login directly",
                    #       self.otp_listener.otp_store[mobile_no])

                    # Try to get OTP directly from the listener

                    while mobile_no not in self.otp_listener.otp_store:
                        print("OTP", self.otp_listener.otp_store)
                        self.log(
                            f"Waiting for OTP from socket for {mobile_no}...")
                        time.sleep(1)

                    otp = self.otp_listener.get_otp(mobile_no, 2)
                    print(f"OTP for {mobile_no}: {otp}")
                    if otp:
                        self.log(f"Received OTP via socket: {otp[:2]}**")

                # If OTP not received via socket, fall back to manual input
                if not otp:
                    # Use the thread-safe input function that prevents interference
                    self.log("No OTP from socket, waiting for manual input...")
                    if not DEFAULT_CONFIG['headless']:
                        otp = self._show_browser_prompt(page)
                        if not otp or otp.strip() == "":
                            # Fallback to secure console input
                            otp = self.secure_input(
                                f"Enter OTP for {self.user_config['phone']}: ")
                    else:
                        otp = self.secure_input(
                            f"Enter OTP for {self.user_config['phone']}: ")

                # Verify OTP is not empty
                if not otp or otp.strip() == "":
                    raise Exception("OTP cannot be empty")

                self.log(f"OTP received, entering OTP: {otp[:2]}**...")
                page.fill('input[name="otp"]', otp)
                page.click('button#submitButton')

                # Wait for dashboard
                self.log("Waiting for dashboard...")
                page.wait_for_selector(
                    'form', state="visible", timeout=60000)

                # Extract CSRF token
                html = page.content()
                self.csrf_token = self.get_csrf_token(html)
                if not self.csrf_token:
                    raise Exception("Failed to extract CSRF token")

                self.log(f"CSRF token obtained: {self.csrf_token[:10]}...")

                # Transfer cookies to requests session

                cookies = context.cookies()
                for cookie in cookies:
                    self.cookie_jar.set(
                        cookie['name'],
                        cookie['value'],
                        domain=cookie.get('domain'),
                        path=cookie.get('path'),
                        secure=cookie.get('secure'),
                        rest={'HttpOnly': cookie.get('httpOnly')}
                    )
                self._update_csrf_token(html)

                self.log("Login completed successfully")
                self.update_state("login_completed")

                # Signal that login is ready
                self.ready_event.set()

                # Wait for booking start time
                self.log("Waiting for booking start time...")
                self.wait_until(DEFAULT_CONFIG['booking_start_time'])
                time.sleep(20)

                # Keep browser open until booking process completes or fails
                return True

        except Exception as e:
            self.log(f"Browser automation failed: {str(e)}", "error")
            return False

    def _update_csrf_token(self, html_content=None):
        """Extract and update CSRF token from response"""
        if not html_content:
            # Refresh token from home page
            response = self.session.get("https://payment.ivacbd.com")
            html_content = response.text

        soup = BeautifulSoup(html_content, 'html.parser')
        token = soup.find('input', {'name': '_token'})
        if token:
            self.csrf_token = token['value']
            self.session.headers.update({'X-CSRF-TOKEN': self.csrf_token})

    def _maintain_session(self, response):
        """Handle session maintenance tasks after each request"""
        # Update CSRF token if present in response
        if response.text:
            self._update_csrf_token(response.text)

        # Check for session expiration
        if response.status_code == 401 or 'login-form' in response.text:
            self.log("Session expired, attempting re-login")
            if self.browser_login():
                return True
            raise Exception("Session maintenance failed - could not re-login")
        return True

    @retry(stop=stop_after_attempt(5), wait=wait_exponential(multiplier=1, min=2, max=10))
    def submit_application_info(self):
        """Submit application information (Step 2)"""
        self.update_state("submitting_application")
        payload = {
            "_token": self.csrf_token,
            "highcom": self.user_config["highcom"],
            "webfile_id": self.user_config["webfile_id"],
            "webfile_id_repeat": self.user_config["webfile_id"],
            "ivac_id": self.user_config["ivac_id"],
            "visa_type": self.user_config["visa_type"],
            "family_count": self.user_config["family_count"],
            "visit_purpose": self.user_config["visit_purpose"]
        }

        response = self.session.post(self.urls["app_info"], data=payload)
        if not self._maintain_session(response):
            raise Exception(
                "Session maintenance failed during application info submission")
        if "PersonalForm" not in response.text:
            raise Exception("Application info submission failed")
        return True

    @retry(stop=stop_after_attempt(5), wait=wait_exponential(multiplier=1, min=2, max=10))
    def submit_personal_info(self):
        """Submit personal information (Step 3)"""
        self.update_state("submitting_personal_info")
        payload = {
            "_token": self.csrf_token,
            "full__name": self.user_config["full_name"],
            "email_name": self.user_config["email"],
            "pho_ne": self.user_config["phone"],
            "web_file_id": self.user_config["webfile_id"],
            "family[1][name]": self.user_config["webfile_id_1_name"],
            "family[1][webfile_no]": self.user_config["webfile_id_1"],
            "family[1][again_webfile_no]": self.user_config["webfile_id_1"],
            "family[2][name]": self.user_config["webfile_id_2_name"],
            "family[2][webfile_no]": self.user_config["webfile_id_2"],
            "family[2][again_webfile_no]": self.user_config["webfile_id_2"]
        }

        response = self.session.post(self.urls["personal_info"], data=payload)
        if self.user_config["webfile_id"] not in response.text:
            raise Exception("Personal info submission failed")
        return True

    @retry(stop=stop_after_attempt(5), wait=wait_exponential(multiplier=1, min=2, max=10))
    def submit_overview(self):
        """Submit overview (Step 4)"""
        self.update_state("submitting_overview")
        response = self.session.post(self.urls["overview"],
                                     data={"_token": self.csrf_token})

        if "payment-option" not in response.text:
            raise Exception("Overview submission failed")
        return True

    @retry(stop=stop_after_attempt(5), wait=wait_exponential(multiplier=1, min=2, max=10))
    def send_otp(self):
        """Send OTP (Step 5)"""
        self.update_state("sending_otp")
        response = self.session.post(self.urls["send_otp"],
                                     data={"_token": self.csrf_token, "resend": "0"})

        if not response.json().get("success"):
            raise Exception("OTP send failed")
        return True

    @retry(stop=stop_after_attempt(5), wait=wait_exponential(multiplier=1, min=2, max=10))
    def verify_otp(self):
        """Verify OTP (Step 6)"""
        self.update_state("verifying_otp")
        mobile_no = self.user_config["phone"]
        while mobile_no not in self.otp_listener.otp_store:
            print("OTP", self.otp_listener.otp_store)
            self.log(
                f"Waiting for OTP from socket for {mobile_no}...")
            time.sleep(1)
        otp = self.otp_listener.get_otp(
            mobile_no) if self.otp_listener else None

        if not otp:
            otp = self.secure_input(f"Enter OTP for {mobile_no}: ")

        response = self.session.post(self.urls["verify_otp"],
                                     data={"_token": self.csrf_token, "otp": otp})
        json_response = response.json()

        if not json_response.get("success"):
            raise Exception("OTP verification failed")

        slot_dates = json_response.get("data", {}).get("slot_dates", [])
        if not slot_dates:
            raise Exception("No slot dates available")

        return slot_dates[0]

    @retry(stop=stop_after_attempt(5), wait=wait_exponential(multiplier=1, min=2, max=10))
    def fetch_slot_time(self, appointment_date):
        """Fetch slot times (Step 7)"""
        self.update_state("fetching_slot_time")
        payload = {
            "_token": self.csrf_token,
            "appointment_date": appointment_date
        }

        response = self.session.post(self.urls["slot_time"], data=payload)
        json_response = response.json()

        if not json_response.get("success"):
            raise Exception("Slot time fetch failed")

        slot_times = json_response.get("data", {}).get("slot_times", [])

        if not slot_times:
            raise Exception("No slot times available")

        return {
            "time": slot_times[0]["hour"],
            "date": json_response["data"]["slot_dates"][0],
            "site_key": self.extract_site_key(json_response.get("captcha", ""))
        }

    def extract_site_key(self, captcha_html):
        """Extract reCAPTCHA site key from HTML"""
        from bs4 import BeautifulSoup
        soup = BeautifulSoup(captcha_html, "html.parser")
        div = soup.find("div", {"class": "g-recaptcha"})
        return div["data-sitekey"] if div else "6LdOCpAqAAAAAOLNB3Vwt_H7Nw4GGCAbdYm5Brsb"

    @retry(stop=stop_after_attempt(5), wait=wait_exponential(multiplier=1, min=2, max=10))
    def complete_payment(self, appointment_time, appointment_date, site_key):
        """Complete payment (Step 8)"""
        self.update_state("processing_payment")
        captcha_token = self.solve_recaptcha(site_key, self.urls["paynow"])

        payload = {
            "_token": self.csrf_token,
            "appointment_date": appointment_date,
            "appointment_time": appointment_time,
            "g-recaptcha-response": captcha_token,
            "selected_payment": self.user_config["payment_method"]
        }

        response = self.session.post(self.urls["paynow"], data=payload)
        if not response.json().get("success"):
            raise Exception("Payment failed")
        return response.json()

    def run_booking_process(self):
        """Execute full booking workflow after successful login"""
        try:
            if not self.validate_session():
                self.log("Initial session validation failed, re-authenticating")
                if not self.browser_login():
                    raise Exception("Could not establish initial session")
            # Application Info
            self.submit_application_info()

            # Personal Info
            self.submit_personal_info()

            # Overview
            self.submit_overview()

            # OTP Handling
            self.send_otp()
            appointment_date = self.verify_otp()

            # Slot Selection
            slot_info = self.fetch_slot_time(appointment_date)

            # Payment
            payment_result = self.complete_payment(
                slot_info["time"],
                slot_info["date"],
                slot_info["site_key"]
            )

            return payment_result

        except requests.exceptions.ConnectionError as e:
            self.log(f"Connection error: {str(e)}", "error")
            self.reset_session()
            raise

    def validate_session(self):
        """Check if session is still valid"""
        try:
            response = self.session.get(
                "https://payment.ivacbd.com/dashboard",
                allow_redirects=False,
                timeout=10
            )
            return response.status_code == 200
        except Exception as e:
            return False

    def reset_session(self):
        """Reset the session completely"""
        self.session.close()
        self.session = requests.Session()
        self.cookie_jar = RequestsCookieJar()
        self.session.cookies = self.cookie_jar
        self.csrf_token = None

    def run(self):
        """Main execution flow with comprehensive error handling"""
        try:
            self.update_state("starting")
            self.wait_until(DEFAULT_CONFIG['login_preparation_time'])

            # Attempt login with retries
            for attempt in range(1, DEFAULT_CONFIG['max_retries'] + 1):
                self.log(
                    f"Login attempt {attempt}/{DEFAULT_CONFIG['max_retries']}")
                if self.browser_login():
                    break
                time.sleep(min(2 ** attempt, 30))  # Exponential backoff
            else:
                raise Exception("All login attempts failed")

            # Execute booking workflow
            result = self.run_booking_process()

            self.update_state("completed", {"success": True, "result": result})
            return True

        except Exception as e:
            self.log(f"Critical error: {str(e)}", "error")
            self.update_state("failed", {"error": str(e)})
            return False


class IVACBookingManager:
    def __init__(self, config_file=None):
        """Initialize booking manager with configuration"""
        self.config = DEFAULT_CONFIG.copy()
        if config_file and os.path.exists(config_file):
            try:
                with open(config_file, 'r') as f:
                    user_config = json.load(f)
                    self.config.update(user_config)
            except json.JSONDecodeError:
                self.log(
                    f"Error parsing config file: {config_file}. Using default configuration.", "error")
            except Exception as e:
                self.log(
                    f"Error loading config: {str(e)}. Using default configuration.", "error")

        # Set up shared state with proper synchronization
        self.manager = Manager()
        self.shared_state = self.manager.dict()
        self.state_lock = self.manager.Lock()

        # Initialize collections
        self.bots = []
        self.threads = []
        self.logger = logging.getLogger("BookingManager")

        # Set up events for coordination
        self.monitor_stop_event = Event()
        self.all_bots_ready = Event()

        # Initialize OTP socket listener
        try:
            self.otp_listener = OTPSocketListener(
                port=self.config.get("otp_socket_port", 9000))
            self.otp_listener.start()
            self.logger.info(
                f"OTP socket listener started on port {self.config.get('otp_socket_port', 9000)}")
        except Exception as e:
            self.log(
                f"Failed to start OTP listener: {str(e)}. OTP functionality will be disabled.", "error")
            self.otp_listener = None

    def log(self, message, level="info"):
        """Centralized logging for manager"""
        if level == "info":
            self.logger.info(message)
        elif level == "error":
            self.logger.error(message)
        elif level == "warning":
            self.logger.warning(message)
        elif level == "debug":
            self.logger.debug(message)

    def validate_config(self):
        """Enhanced configuration validation"""
        issues = []
        required_fields = {
            "users": [
                "phone", "password", "webfile_id", "full_name",
                "email", "visa_type", "highcom", "ivac_id",
                "payment_method", "webfileId_1", "webfileId_1_name",
                "webfileId_2", "webfileId_2_name"
            ],
            "root": [
                "anticaptcha_key", "booking_start_time",
                "login_preparation_time", "max_retries"
            ]
        }

        # Validate root-level config
        for field in required_fields["root"]:
            if field not in self.config:
                issues.append(f"Missing required configuration field: {field}")

        # Validate user configurations
        for idx, user in enumerate(self.config.get("users", [])):
            for field in required_fields["users"]:
                if field not in user:
                    issues.append(f"User {idx+1} missing field: {field}")

        return issues

    def create_bots(self):
        """Create bot instances for each user with validation"""
        issues = self.validate_config()
        if issues:
            self.log("Configuration validation failed:", "error")
            for issue in issues:
                self.log(f"- {issue}", "error")
            raise ValueError(
                "Invalid configuration. Please fix the issues and try again.")

        for idx, user_config in enumerate(self.config["users"]):
            bot = IVACBot(user_config, self.shared_state,
                          bot_id=idx, otp_listener=self.otp_listener)
            self.bots.append(bot)
            self.log(
                f"Created bot {idx} for user {user_config.get('phone', 'unknown')}")

        return len(self.bots)

    def monitor_progress(self):
        """Monitor and report progress of all bots with improved status reporting"""
        interval = self.config.get("monitor_interval", 30)
        last_reported = {}  # Track last reported state to avoid duplicate messages

        while not self.monitor_stop_event.is_set():
            # Sleep first to avoid immediate interference with input prompts
            # More responsive checking of stop event
            self.monitor_stop_event.wait(min(5, interval))
            if self.monitor_stop_event.is_set():
                break

            # Skip reporting if any input is being collected
            if input_lock.locked():
                continue

            current_time = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            all_completed = True
            all_failed = True
            changed = False

            self.log(f"===== PROGRESS REPORT ({current_time}) =====")

            with self.state_lock:
                for bot_id, state in self.shared_state.items():
                    print(self.shared_state)
                    print(state)
                    stage = state.get("stage", "unknown")
                    user_id = state.get("user_id", "unknown")
                    last_updated = state.get("last_updated", "unknown")

                    # Only report changes or initial status
                    prev_state = last_reported.get(bot_id, {}).get("stage")
                    if prev_state != stage:
                        self.log(
                            f"Bot {bot_id} ({user_id}): {prev_state or 'N/A'} → {stage}")
                        last_reported[bot_id] = {
                            "stage": stage, "time": current_time}
                        changed = True

                    if stage != "completed" and stage != "failed":
                        all_completed = False
                        all_failed = False

            if not changed and len(self.shared_state) > 0:
                self.log("No state changes since last report")

            self.log("==========================")

            if (all_completed or all_failed) and len(self.shared_state) > 0:
                self.log(
                    "All processes have completed or failed. Stopping monitoring.")
                break

    def run_bot(self, bot):
        """Run a single bot in a thread with proper error handling"""
        try:
            self.log(f"Bot {bot.bot_id} starting...")
            success = bot.run()

            if success:
                self.log(f"Bot {bot.bot_id} completed successfully")
            else:
                self.log(f"Bot {bot.bot_id} failed", "error")

        except Exception as e:
            self.log(
                f"Bot {bot.bot_id} crashed with unhandled exception: {str(e)}", "error")
            import traceback
            self.log(traceback.format_exc(), "error")

            # Update state to reflect crash
            with self.state_lock:
                self.shared_state[bot.bot_id] = {
                    "stage": "crashed",
                    "details": {"error": str(e)},
                    "last_updated": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    "user_id": bot.user_config.get("phone", "unknown")
                }

    def start_all(self):
        """Start all bots in parallel threads with improved coordination"""
        try:
            num_bots = self.create_bots()
            if num_bots == 0:
                self.log("No valid bots to start", "error")
                return {}

            self.log(f"Starting {num_bots} booking bot(s)...")

            # Start monitoring thread
            monitor_thread = Thread(target=self.monitor_progress)
            monitor_thread.daemon = True
            monitor_thread.start()
            self.log("Status monitoring started")

            # Start all bot threads with staggered start
            for i, bot in enumerate(self.bots):
                bot_thread = Thread(target=self.run_bot, args=(
                    bot,), name=f"Bot-{bot.bot_id}")
                bot_thread.daemon = False  # Make sure threads continue if main thread exits
                self.threads.append(bot_thread)
                bot_thread.start()
                self.log(f"Started thread for bot {bot.bot_id}")

                # Add a small delay between starting threads to avoid resource contention
                stagger_delay = min(3, self.config.get(
                    "thread_stagger_delay", 1))
                time.sleep(stagger_delay)

            # Wait for all bots to be in ready state (optional)
            ready_timeout = self.config.get(
                "bot_ready_timeout", 300)  # 5 minutes default
            all_ready = self.wait_for_all_ready(timeout=ready_timeout)
            if all_ready:
                self.log("All bots are ready for booking process")
            else:
                self.log(
                    "Not all bots reached ready state within timeout", "warning")

            # Wait for all threads to complete with timeout
            thread_timeout = self.config.get(
                "thread_join_timeout", 7200)  # 2 hours default
            end_time = time.time() + thread_timeout

            for t in self.threads:
                remaining = max(1, end_time - time.time())
                t.join(timeout=remaining)
                if t.is_alive():
                    self.log(
                        f"Thread {t.name} did not complete within timeout", "warning")

            # Stop the monitor thread
            self.monitor_stop_event.set()
            monitor_thread.join(timeout=10)
            if monitor_thread.is_alive():
                self.log("Monitor thread did not terminate cleanly", "warning")

            # Check for threads that didn't complete
            alive_threads = [t for t in self.threads if t.is_alive()]
            if alive_threads:
                self.log(
                    f"{len(alive_threads)} bot threads still running", "warning")
            else:
                self.log("All bot processes have completed")

            return self.get_results()

        except Exception as e:
            self.log(f"Critical error in booking manager: {str(e)}", "error")
            import traceback
            self.log(traceback.format_exc(), "error")
            self.stop_all()
            return {"error": str(e)}

    def wait_for_all_ready(self, timeout=300):
        """Wait for all bots to reach ready state with timeout"""
        start_time = time.time()
        while time.time() - start_time < timeout:
            all_ready = True
            for bot in self.bots:
                if not bot.ready_event.is_set():
                    all_ready = False
                    break

            if all_ready:
                return True

            time.sleep(1)

        return False

    def get_results(self):
        """Collect and return comprehensive results from all bots"""
        results = {}
        success_count = 0
        failure_count = 0

        with self.state_lock:
            for bot_id, state in self.shared_state.items():
                stage = state.get("stage", "unknown")
                details = state.get("details", {})

                results[bot_id] = {
                    "user_id": state.get("user_id", "unknown"),
                    "final_stage": stage,
                    "details": details,
                    "success": stage == "completed" and details.get("success", False)
                }

                if results[bot_id]["success"]:
                    success_count += 1
                elif stage == "failed" or stage == "crashed":
                    failure_count += 1

        # Add summary information
        results["summary"] = {
            "total_bots": len(self.bots),
            "success_count": success_count,
            "failure_count": failure_count,
            "completion_time": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }

        return results

    def stop_all(self):
        """Stop all running bots and cleanup resources"""
        self.log("Stopping all booking processes...")
        self.monitor_stop_event.set()

        for bot in self.bots:
            bot.stop_event.set()

        # Stop OTP listener
        if self.otp_listener:
            try:
                self.otp_listener.stop()
                self.log("OTP listener stopped")
            except Exception as e:
                self.log(f"Error stopping OTP listener: {str(e)}", "error")

        # Wait briefly for threads to react to stop events
        time.sleep(2)

        # Check if any threads are still running
        running_threads = [t for t in self.threads if t.is_alive()]
        if running_threads:
            self.log(
                f"{len(running_threads)} threads still running after stop request", "warning")
        else:
            self.log("All threads have been stopped")

        return len(running_threads) == 0


def create_config_file(filename="config.json"):
    """Create a sample configuration file"""
    with open(filename, 'w') as f:
        json.dump(DEFAULT_CONFIG, f, indent=4)
    print(f"Sample configuration file created: {filename}")
    print("Please edit this file with your actual user information before running the program.")


if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1 and sys.argv[1] == "--create-config":
        create_config_file()
        sys.exit(0)

    config_file = "config.json"
    if not os.path.exists(config_file):
        print(f"Configuration file '{config_file}' not found.")
        print("Run with --create-config to generate a sample configuration file.")
        sys.exit(1)

    print("Starting IVAC Booking Manager...")
    manager = IVACBookingManager(config_file)
    try:
        results = manager.start_all()
        print("\nFinal Results:")
        for bot_id, result in results.items():
            print(
                f"Bot {bot_id} ({result['user_id']}): {result['final_stage']}")
    except KeyboardInterrupt:
        print("\nProcess interrupted by user. Stopping all bots...")
        manager.stop_all()
