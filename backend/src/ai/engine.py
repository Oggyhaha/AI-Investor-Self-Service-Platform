import logging
import json
import datetime
from typing import List, Dict, Any, Optional
from google import genai
from google.genai import types


from src.core.config import get_settings
from src.ai.prompts import SYSTEM_PROMPT
from src.ai.tools import AIToolExecutor

logger = logging.getLogger(__name__)
settings = get_settings()

# Define Tool Schemas manually for maximum control and async safety
tool_declarations = [
    {
        "name": "get_investor_profile",
        "description": "Fetch general investor details (name, email, PAN, address).",
        "parameters": {"type": "OBJECT", "properties": {}}
    },
    {
        "name": "get_portfolio_summary",
        "description": "Fetch aggregate portfolio values (total invested, current value, returns).",
        "parameters": {"type": "OBJECT", "properties": {}}
    },
    {
        "name": "get_portfolio_holdings",
        "description": "Fetch detailed mutual fund holdings breakdown.",
        "parameters": {"type": "OBJECT", "properties": {}}
    },
    {
        "name": "get_sip_list",
        "description": "Fetch list of all SIPs, showing status and installment details.",
        "parameters": {"type": "OBJECT", "properties": {}}
    },
    {
        "name": "get_failed_sips",
        "description": "Fetch failed SIP details with mandate status and bank failure reasons.",
        "parameters": {"type": "OBJECT", "properties": {}}
    },
    {
        "name": "get_kyc_status",
        "description": "Fetch verification status checklist for KYC.",
        "parameters": {"type": "OBJECT", "properties": {}}
    },
    {
        "name": "get_nominee_list",
        "description": "Fetch registered nominee allocations and minor status.",
        "parameters": {"type": "OBJECT", "properties": {}}
    },
    {
        "name": "get_recent_transactions",
        "description": "Fetch transaction history details (limit 5).",
        "parameters": {"type": "OBJECT", "properties": {}}
    },
    {
        "name": "create_kyc_reverification_ticket",
        "description": "Create a service request ticket to update KYC information.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "full_name": {"type": "STRING", "description": "Full name of the investor"},
                "dob": {"type": "STRING", "description": "Date of birth in YYYY-MM-DD format"},
                "pan": {"type": "STRING", "description": "PAN Card number (10 characters)"},
                "aadhaar": {"type": "STRING", "description": "Aadhaar Card number (12 digits)"}
            },
            "required": ["full_name", "dob", "pan", "aadhaar"]
        }
    },
    {
        "name": "create_nominee_change_ticket",
        "description": "Create a service request ticket to register nominee changes.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "nominee_name": {"type": "STRING", "description": "Full name of the nominee"},
                "relationship": {"type": "STRING", "description": "Relationship (e.g. Spouse, Son, Mother)"},
                "dob": {"type": "STRING", "description": "Date of birth of the nominee (YYYY-MM-DD)"},
                "allocation_pct": {"type": "NUMBER", "description": "Percentage allocation (1-100)"},
                "guardian_name": {"type": "STRING", "description": "Guardian name if nominee is minor (optional)"}
            },
            "required": ["nominee_name", "relationship", "dob", "allocation_pct"]
        }
    },
    {
        "name": "generate_account_statement",
        "description": "Generate and record a mutual fund statement for download.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "statement_type": {"type": "STRING", "description": "Type of statement: account, transaction, holding, or capital_gains"},
                "period_from": {"type": "STRING", "description": "Start date in YYYY-MM-DD format"},
                "period_to": {"type": "STRING", "description": "End date in YYYY-MM-DD format"}
            },
            "required": ["statement_type", "period_from", "period_to"]
        }
    },
    {
        "name": "escalate_to_advisor",
        "description": "Escalate the conversation to a human support advisor.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "reason": {"type": "STRING", "description": "Reason for escalation"}
            },
            "required": ["reason"]
        }
    }
]

class GeminiConversationEngine:
    def __init__(self):
        self.api_key = settings.gemini_api_key
        self.use_mock = False
        
        if not self.api_key or self.api_key == "your-gemini-api-key-here" or self.api_key.strip() == "":
            logger.warning("Gemini API key not configured or contains placeholder. Falling back to Mock AI Mode.")
            self.use_mock = True
            self.client = None
        else:
            try:
                self.client = genai.Client(api_key=self.api_key)
                self.model = "gemini-2.5-flash"
            except Exception as e:
                logger.error(f"Failed to initialize Gemini Client: {e}. Falling back to Mock AI Mode.")
                self.use_mock = True
                self.client = None

    async def chat(self, messages: List[Dict[str, Any]], executor: AIToolExecutor) -> Dict[str, Any]:
        """Send message history to Gemini or execute via Mock Engine if in mock mode.

        Args:
            messages: List of message dicts with 'role' and 'content'.
            executor: The database tool executor.

        Returns:
            Dict containing 'content', 'intent', and any metadata (e.g. tool execution).
        """
        if self.use_mock:
            return await self._run_mock_engine(messages, executor)

        try:
            # Format history for Gemini
            contents = []
            
            # System instruction passed separately in config
            for m in messages:
                role = m.get("role")
                content = m.get("content")
                
                # Normalize roles for Gemini API (user or model)
                gemini_role = "user" if role == "user" else "model"
                contents.append(
                    types.Content(
                        role=gemini_role,
                        parts=[types.Part.from_text(text=content)]
                    )
                )

            # Build config with tools
            gemini_tools = [
                types.Tool(
                    function_declarations=[
                        types.FunctionDeclaration(
                            name=t["name"],
                            description=t["description"],
                            parameters=t["parameters"]
                        )
                        for t in tool_declarations
                    ]
                )
            ]

            config = types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
                tools=gemini_tools,
                temperature=0.2
            )

            # 1. Call Gemini
            response = self.client.models.generate_content(
                model=self.model,
                contents=contents,
                config=config
            )

            # 2. Check if Gemini returned a function call
            if response.function_calls:
                call = response.function_calls[0]
                tool_name = call.name
                tool_args = call.args

                logger.info(f"Gemini requested tool call: {tool_name} with args {tool_args}")
                
                # Execute tool locally
                tool_method = getattr(executor, tool_name, None)
                if tool_method:
                    try:
                        result = await tool_method(**tool_args)
                    except Exception as e:
                        result = {"error": f"Tool execution failed: {str(e)}"}
                else:
                    result = {"error": f"Tool method '{tool_name}' not implemented"}

                # Save tool execution details to metadata
                metadata = {
                    "tool_called": tool_name,
                    "tool_args": tool_args,
                    "tool_result": result
                }

                # Construct a follow-up prompt representing the tool output
                # We send the tool output back to Gemini to generate the final user-facing text
                contents.append(response.candidates[0].content)  # Add the model's tool request content
                
                contents.append(
                    types.Content(
                        role="user",
                        parts=[
                            types.Part.from_function_response(
                                name=tool_name,
                                response={"result": result}
                            )
                        ]
                    )
                )

                # Call Gemini again with the tool result
                final_response = self.client.models.generate_content(
                    model=self.model,
                    contents=contents,
                    config=config
                )

                # Return the final text
                detected_intent = self._detect_intent_from_tool(tool_name)
                return {
                    "content": final_response.text,
                    "intent": detected_intent,
                    "metadata": metadata
                }

            # If no tool call, just return response text
            return {
                "content": response.text,
                "intent": self._classify_intent_locally(messages[-1]["content"]),
                "metadata": None
            }

        except Exception as e:
            logger.error(f"Gemini API execution error: {e}. Falling back to local Mock engine for this message.")
            return await self._run_mock_engine(messages, executor)

    def _detect_intent_from_tool(self, tool_name: str) -> str:
        intent_map = {
            "get_investor_profile": "VIEW_PROFILE",
            "get_portfolio_summary": "VIEW_PORTFOLIO",
            "get_portfolio_holdings": "VIEW_PORTFOLIO",
            "get_sip_list": "CHECK_SIP",
            "get_failed_sips": "CHECK_SIP",
            "get_kyc_status": "VIEW_KYC",
            "get_nominee_list": "VIEW_NOMINEE",
            "get_recent_transactions": "VIEW_TRANSACTIONS",
            "create_kyc_reverification_ticket": "UPDATE_KYC",
            "create_nominee_change_ticket": "UPDATE_NOMINEE",
            "generate_account_statement": "DOWNLOAD_STATEMENT",
            "escalate_to_advisor": "ESCALATION"
        }
        return intent_map.get(tool_name, "GENERAL_FAQ")

    def _classify_intent_locally(self, text: str) -> str:
        text = text.lower()
        if "sip" in text:
            return "CHECK_SIP"
        elif "portfolio" in text or "holding" in text or "investment" in text:
            return "VIEW_PORTFOLIO"
        elif "statement" in text or "download" in text or "pdf" in text:
            return "DOWNLOAD_STATEMENT"
        elif "kyc" in text:
            return "VIEW_KYC"
        elif "nominee" in text:
            return "VIEW_NOMINEE"
        elif "advisor" in text or "human" in text or "support" in text or "escalate" in text:
            return "ESCALATION"
        return "GENERAL_FAQ"

    async def _run_mock_engine(self, messages: List[Dict[str, Any]], executor: AIToolExecutor) -> Dict[str, Any]:
        """A smart rule-based conversational assistant fallback that queries the DB and formats responses.

        Ensures full app functionality without an active Gemini API key.
        """
        user_message = messages[-1]["content"].lower()
        intent = self._classify_intent_locally(user_message)
        metadata = None

        if intent == "CHECK_SIP":
            if "fail" in user_message or "reason" in user_message or "error" in user_message:
                data = await executor.get_failed_sips()
                failed_sips = data.get("failed_sips", [])
                metadata = {"tool_called": "get_failed_sips", "tool_result": data}
                if failed_sips:
                    resp = "I found a failed SIP in your account:\n\n"
                    for s in failed_sips:
                        resp += f"- **SIP Ref**: {s['sip_id']}\n  **Fund**: {s['fund_name']}\n  **Amount**: ₹{s['amount']}\n  **Bank**: {s['bank_name']}\n  **Failure Reason**: {s['failure_reason']}\n  **Mandate Status**: {s['mandate_status']}\n\n"
                    resp += "It failed because of insufficient balance or pending mandates with your bank. Would you like me to connect you with an advisor to resolve this?"
                else:
                    resp = "I couldn't find any failed SIPs in your record. All your registered SIPs are in active standing."
            else:
                data = await executor.get_sip_list()
                sips = data.get("sips", [])
                metadata = {"tool_called": "get_sip_list", "tool_result": data}
                if sips:
                    resp = "Here are your active SIP schedules:\n\n"
                    for s in sips:
                        resp += f"- **{s['fund_name']}**\n  SIP ID: {s['sip_id']}\n  Amount: ₹{s['amount']}\n  Frequency: {s['frequency']}\n  Due Date: Day {s['sip_date']} of the month\n  Status: {s['status'].upper()}\n  Completed Installments: {s['completed_installments']}\n\n"
                else:
                    resp = "You do not have any active SIP investments scheduled at the moment."

        elif intent == "VIEW_PORTFOLIO":
            summary = await executor.get_portfolio_summary()
            holdings = await executor.get_portfolio_holdings()
            metadata = {"tool_called": "get_portfolio_summary", "tool_result": summary}
            resp = (
                f"Here is your Portfolio valuation summary:\n\n"
                f"- **Total Capital Invested**: ₹{summary['total_invested']}\n"
                f"- **Current Portfolio Value**: ₹{summary['current_value']}\n"
                f"- **Absolute Gains/Returns**: ₹{summary['absolute_returns']}\n"
                f"- **Return Rate (CAGR)**: {summary['returns_pct']}%\n\n"
                f"Your holdings are split across the following mutual funds:\n"
            )
            for h in holdings.get("holdings", []):
                resp += f"- **{h['fund_name']}**: Invested: ₹{h['invested_amount']} | Current: ₹{h['current_value']} ({h['returns_pct']}% returns)\n"

        elif intent == "DOWNLOAD_STATEMENT":
            # Determine statement type
            st_type = "account"
            if "gains" in user_message or "tax" in user_message:
                st_type = "capital_gains"
            elif "holding" in user_message:
                st_type = "holding"
            
            period_from = (datetime.date.today() - datetime.timedelta(days=365)).isoformat()
            period_to = datetime.date.today().isoformat()
            
            data = await executor.generate_account_statement(st_type, period_from, period_to)
            metadata = {"tool_called": "generate_account_statement", "tool_result": data}
            resp = (
                f"I have successfully generated your **{st_type.upper().replace('_', ' ')} Statement** "
                f"for the period {period_from} to {period_to}.\n\n"
                f"You can now download the statement file from your Dashboard's **Statements** download section."
            )

        elif intent == "VIEW_KYC":
            data = await executor.get_kyc_status()
            metadata = {"tool_called": "get_kyc_status", "tool_result": data}
            status_text = data["kyc_status"].upper()
            resp = (
                f"Your KYC Verification status is: **{status_text}**.\n\n"
                f"Checklist Status:\n"
                f"- PAN Check: {'✅ Verified' if data['pan_verified'] else '❌ Pending'}\n"
                f"- Aadhaar Check: {'✅ Verified' if data['aadhaar_verified'] else '❌ Pending'}\n"
                f"- Address Check: {'✅ Verified' if data['address_verified'] else '❌ Pending'}\n"
                f"- Identity Photo: {'✅ Verified' if data['photo_verified'] else '❌ Pending'}\n"
            )
            if data["kyc_status"] != "verified":
                resp += "\nTo re-verify your KYC checklist, please type 're-verify KYC' and provide your details."

        elif intent == "VIEW_NOMINEE":
            data = await executor.get_nominee_list()
            nominees = data.get("nominees", [])
            metadata = {"tool_called": "get_nominee_list", "tool_result": data}
            if nominees:
                resp = "Here are your registered account nominees:\n\n"
                for n in nominees:
                    resp += f"- **{n['nominee_name']}** ({n['relationship']})\n  Allocation Share: {n['allocation_pct']}%\n  Minor status: {'Guardian required' if n['is_minor'] else 'No'}\n  Status: {n['status'].upper()}\n\n"
            else:
                resp = "You have no nominees registered. It is highly recommended to register a nominee for security of your mutual funds."

        elif intent == "ESCALATION":
            data = await executor.escalate_to_advisor("User requested a human agent.")
            metadata = {"tool_called": "escalate_to_advisor", "tool_result": data}
            resp = "I have escalated this conversation to a human support advisor. A service ticket has been created (Ticket ID: " + data["ticket_id"] + "). They will review the conversation summary and assist you shortly."

        else:
            # Handle forms/creation requests in mock
            if "re-verify kyc" in user_message or "update kyc" in user_message:
                profile = await executor.get_investor_profile()
                data = await executor.create_kyc_reverification_ticket(
                    full_name=profile["full_name"],
                    dob="1990-01-01",
                    pan=profile["pan"],
                    aadhaar="1234-5678-9012"
                )
                metadata = {"tool_called": "create_kyc_reverification_ticket", "tool_result": data}
                resp = f"Sure, I have created a KYC re-verification request for you. Your ticket ID is **{data['ticket_id']}**. A support agent will verify your documents."
            elif "change nominee" in user_message or "add nominee" in user_message:
                data = await executor.create_nominee_change_ticket(
                    nominee_name="Sunita Sharma",
                    relationship="Spouse",
                    dob="1992-05-15",
                    allocation_pct=100.0
                )
                metadata = {"tool_called": "create_nominee_change_ticket", "tool_result": data}
                resp = f"I have registered a nominee change ticket for you. Your service ticket ID is **{data['ticket_id']}**. Support team will review."
            else:
                resp = "Hello! I am AURA, your investor self-service virtual assistant. I can help you check your portfolio, transaction history, SIP mandate status, download statements, verify KYC checkpoints, or manage account nominees. What can I do for you today?"

        return {
            "content": resp,
            "intent": intent,
            "metadata": metadata
        }
