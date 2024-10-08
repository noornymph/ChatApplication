const grpc = require("@grpc/grpc-js"); // Use @grpc/grpc-js instead of grpc
const protoLoader = require("@grpc/proto-loader"); // Import proto-loader

const PROTO_PATH = "chat.proto"; // Path to your .proto file
const SERVER_URI = "0.0.0.0:9090";

const usersInChat = [];
const observers = [];

// Load the proto file using proto-loader
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  defaults: true,
  oneofs: true,
});

// Create the gRPC client package
const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);

// Implement the gRPC methods
const join = (call, callback) => {
  const user = call.request;

  // Check if the user already exists
  const userExist = usersInChat.find((_user) => _user.name === user.name);
  if (!userExist) {
    usersInChat.push(user);
    callback(null, { error: 0, msg: "Success" });
  } else {
    callback(null, { error: 1, msg: "User already exists." });
  }
};

const sendMsg = (call, callback) => {
  const chatObj = call.request;
  observers.forEach((observer) => {
    observer.call.write(chatObj);
  });
  callback(null, {});
};

const getAllUsers = (call, callback) => {
  callback(null, { users: usersInChat });
};

const receiveMsg = (call) => {
  observers.push({ call });
};

// Set up the gRPC server
const server = new grpc.Server();
server.addService(protoDescriptor.ChatService.service, {
  join,
  sendMsg,
  getAllUsers,
  receiveMsg,
});

server.bindAsync(
  SERVER_URI,
  grpc.ServerCredentials.createInsecure(),
  (error, port) => {
    if (error) {
      console.error(`Failed to bind server: ${error}`);
      return;
    }
    server.start();
    console.log("Server is running on " + SERVER_URI);
  }
);
