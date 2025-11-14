# Use the official Bun image as the base image
FROM oven/bun:1

# Set the working directory inside the container
WORKDIR /home/bun/app

# Copy package.json and bun.lockb (if present) to leverage Docker's layer caching
COPY package.json bun.lockb ./

# Install dependencies using bun install
RUN bun install --frozen-lockfile

# Copy the rest of your application code
COPY . .

# Expose the port your Bun application listens on (e.g., 3000 for a web server)
EXPOSE 3000

# Define the command to run your Bun application when the container starts
CMD ["bun", "run", "start"]
