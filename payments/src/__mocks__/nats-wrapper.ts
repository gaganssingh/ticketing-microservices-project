export const natsWrapper = {
  // MOCK IMPLEMENTATION FOR TESTING PURPOSES ONLY
  // MIMICS THE FUNCTIONALITY OF THE ACTUAL BUSINESS LOGIC
  client: {
    publish: jest
      .fn()
      .mockImplementation(
        (subject: string, data: string, callback: () => void) => {
          callback();
        }
      ),
  },
};
