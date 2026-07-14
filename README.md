# OpenClaw + Qwen Local Setup

## Quick Start

1. **Install dependencies:**
```bash
pip install -r requirements.txt
```

2. **Clone OpenClaw:**
```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
```

3. **Set up OpenClaw:**
```bash
# Install Python dependencies
pip install -r requirements.txt

# Create config directory
mkdir -p ~/.openclaw/workspace

# Copy config to workspace
cp -r /home/aldenpark/dev/qwen_local_openclaw/openclaw_settings/* ~/.openclaw/workspace/

# Copy memories
mkdir -p ~/.openclaw/workspace/memories
cp -r /home/aldenpark/dev/qwen_local_openclaw/memories/* ~/.openclaw/workspace/memories/
```

4. **Set up Qwen local:**
```bash
cd models
./qwen-local.sh daemon
```

5. **Start OpenClaw:**
```bash
openclaw gateway start
```

## What's Included

### Configuration
- `openclaw.json` - OpenClaw settings
- `models/qwen-model-presets.json` - Model presets including qwen35-9b-q8
- `models/qwen-local.sh` - Qwen local launcher
- `models/qwen-openclaw-optuna-tune.py` - Model tuning script

### Memory/Persona Files
- `AGENTS.md` - Workspace rules
- `SOUL.md` - Assistant personality
- `USER.md` - User profile
- `MEMORY.md` - Long-term memory
- `IDENTITY.md` - Agent identity
- `TOOLS.md` - Local notes
- `HEARTBEAT.md` - Heartbeat tasks

### Model Files
- `qwen3-4b-q5/` - Qwen3-4B Q5 model
- `qwen3.5-4b-q5km/` - Qwen3.5-4B Q5_K_M model
- `qwen-model-presets.json` - Model metadata

## Notes

- This setup is configured for Apple Silicon/M4 with Metal backend
- Default model: Qwen3.5-4B-Q5_K_M.gguf
- Context tokens: 153,600
- Reasoning budget: 512 tokens

## Troubleshooting

### Qwen local not starting
```bash
# Check qwen-local service
systemctl status qwen-local

# Check logs
journalctl -u qwen-local -f
```

### OpenClaw not responding
```bash
# Check Gateway status
openclaw gateway status

# Check model service
nc -zv 127.0.0.1 18080
```

## License

See LICENSE in openclaw repo.
