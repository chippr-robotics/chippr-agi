# Use the official Node.js LTS (Long Term Support) version as a parent image
FROM node:lts

# Set the working directory within the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json into the working directory
COPY package*.json ./

# Install any needed dependencies
RUN npm install

# Bundle app source by copying the application files into the working directory
COPY . .

# Define the command to run the application
CMD ["npm", "start"]