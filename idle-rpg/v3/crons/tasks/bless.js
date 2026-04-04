const { ChannelType } = require('discord.js');
const { setImportantMessage } = require('../../utils/messageHelpers');

async function blessExpire(bot, game) {
  console.log('Running blessExpire cron');
  for (const [, guild] of bot.guilds.cache) {
    const expireResult = await game.db.expireBless(guild.id);
    if (!expireResult) continue;
    const { expiredBlesses, updated, originalMultiplier } = expireResult;
    console.log(`Guild ${guild.id} - Expired blesses:`, expiredBlesses);

    const actionChannel = guild.channels.cache.find(
      (channel) => channel && channel.name === 'actions' && channel.type === ChannelType.GuildText,
    );
    if (!actionChannel) continue;

    let runningBlessCount =
      updated.spells.bless.reduce((prev, curr) => prev + curr.count, 0) +
      expiredBlesses.reduce((prev, curr) => prev + curr.count, 0);
    let runningMultiplier = originalMultiplier;

    for (const bless of expiredBlesses) {
      const loadedCaster = await game.db.loadPlayer(bless.castBy);
      if (!loadedCaster) continue;
      runningBlessCount -= bless.count;
      runningMultiplier = Math.max(1, runningMultiplier - bless.count);
      actionChannel.send(
        setImportantMessage(
          `${loadedCaster.name}${loadedCaster.titles.current !== 'None' ? ` the ${loadedCaster.titles.current}` : ''}'s Bless just wore off.\nCurrent Active Bless: ${runningBlessCount}\nCurrent Multiplier is: ${runningMultiplier}x`,
        ),
      );
    }
  }
}

module.exports = { blessExpire };
