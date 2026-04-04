const { ChannelType } = require('discord.js');
const { setImportantMessage } = require('../../utils/messageHelpers');

async function blessExpire(bot, game) {
  console.log('Running blessExpire cron');
  await Promise.all(
    Array.from(bot.guilds.cache.values()).map(async (guild) => {
      const expireResult = await game.db.expireBless(guild.id);
      if (!expireResult) return;
      const { expiredBlesses, updated, originalMultiplier } = expireResult;
      console.log(`Guild ${guild.id} - Expired blesses:`, expiredBlesses);

      const actionChannel = guild.channels.cache.find(
        (channel) =>
          channel && channel.name === 'actions' && channel.type === ChannelType.GuildText,
      );
      if (!actionChannel) return;

      let runningBlessCount =
        updated.spells.bless.reduce((prev, curr) => prev + curr.count, 0) +
        expiredBlesses.reduce((prev, curr) => prev + curr.count, 0);
      let runningMultiplier = originalMultiplier;

      // Should not resolve in parellell since we want the messages to be in order of expiration
      for (const bless of expiredBlesses) {
        const loadedCaster = await game.db.loadPlayer(bless.castBy);
        if (!loadedCaster) return;
        runningBlessCount -= bless.count;
        runningMultiplier = Math.max(1, runningMultiplier - bless.count);
        actionChannel.send(
          setImportantMessage(
            `${loadedCaster.name}${loadedCaster.titles.current !== 'None' ? ` the ${loadedCaster.titles.current}` : ''}'s Bless just wore off.\nCurrent Active Bless: ${runningBlessCount}\nCurrent Multiplier is: ${runningMultiplier}x`,
          ),
        );
      }
    }),
  );
}

module.exports = { blessExpire };
