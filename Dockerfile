# Choose a base image with Node 20
FROM node:20-bullseye-slim

# Install Python and system dependencies
RUN apt-get update \
    && apt-get install -y python3 python3-pip curl \
    && rm -rf /var/lib/apt/lists/* \
    && ln -sf /usr/bin/python3 /usr/local/bin/python \
    && ln -sf /usr/bin/pip3 /usr/local/bin/pip

# Setup user for compatibility
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

WORKDIR $HOME/app

# Copy the requirements file and install Python packages
COPY --chown=user requirements.txt .
RUN python3 -m pip install --no-cache-dir -r requirements.txt

# Copy local code to the container image
COPY --chown=user . .

# Build the Expo App
WORKDIR $HOME/app/VibeMatchApp
RUN npm install
RUN npx expo export --platform web

# Return to root application directory
WORKDIR $HOME/app

# Hugging Face runs exactly on port 7860
EXPOSE 7860

# Command to run the FastAPI server
CMD uvicorn main:app --host 0.0.0.0 --port $PORT
