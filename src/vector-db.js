const redis = require('redis');

class VectorDB {
  constructor(name, redisOptions) {
    this.name = name;
    this.redisClient = redis.createClient(redisOptions);
  }

  async create() {
    return new Promise((resolve, reject) => {
      this.redisClient.send_command('FT.CREATE', [this.name, 'SCHEMA', 'task_id', 'TEXT', 'embedding', 'VECTOR'], (err, res) => {
        if (err) {
          reject(err);
        } else {
          resolve(res);
        }
      });
    });
  }

  async save(taskId, embedding) {
    return new Promise((resolve, reject) => {
      this.redisClient.send_command('FT.ADD', [this.name, taskId, '1.0', 'FIELDS', 'embedding', embedding], (err, res) => {
        if (err) {
          reject(err);
        } else {
          resolve(res);
        }
      });
    });
  }

  async get(taskId) {
    return new Promise((resolve, reject) => {
      this.redisClient.send_command('FT.GET', [this.name, taskId], (err, res) => {
        if (err) {
          reject(err);
        } else if (!res) {
          resolve(null);
        } else {
          resolve(res[1]);
        }
      });
    });
  }

  async update(taskId, embedding) {
    return new Promise((resolve, reject) => {
      this.redisClient.send_command('FT.ADD', [this.name, taskId, '1.0', 'REPLACE', 'FIELDS', 'embedding', embedding], (err, res) => {
        if (err) {
          reject(err);
        } else {
          resolve(res);
        }
      });
    });
  }

  async getNeighbors(embedding) {
    return new Promise((resolve, reject) => {
      this.redisClient.send_command('FT.SEARCH', [this.name, '*', 'NEARBY', 'NEIGHBOR', 'WITHSCORES', 'MAX', '5', 'FILTER', 'embedding', embedding], (err, res) => {
        if (err) {
          reject(err);
        } else {
          const neighbors = [];
          for (let i = 0; i < res.length; i += 2) {
            const taskId = res[i];
            const distance = res[i + 1];
            neighbors.push({ taskId, distance });
          }
          resolve(neighbors);
        }
      });
    });
  }
}

module.exports = { VectorDB };
