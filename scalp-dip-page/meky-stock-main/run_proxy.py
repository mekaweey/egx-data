import os
import sys
import subprocess

if __name__ == "__main__":
    from litellm.proxy.proxy_cli import run_server
    sys.argv = ["litellm", "--config", "config.yaml", "--port", "4000", "--telemetry", "False"]
    run_server()
