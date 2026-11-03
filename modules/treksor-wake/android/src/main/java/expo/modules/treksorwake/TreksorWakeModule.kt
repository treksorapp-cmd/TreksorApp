package expo.modules.treksorwake
import android.content.Intent
import android.provider.AlarmClock
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class TreksorWakeModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("TreksorWake")
    Function("isAvailable") { true }
    AsyncFunction("openClock") { hour: Int, minute: Int, sound: String ->
      require(hour in 0..23 && minute in 0..59 && Regex("wake_[0-9]{2}\\.wav").matches(sound))
      val context = appContext.reactContext ?: throw IllegalStateException("Open Treksor first")
      val resource = context.resources.getIdentifier(sound.removeSuffix(".wav"), "raw", context.packageName)
      val intent = Intent(AlarmClock.ACTION_SET_ALARM).apply {
        putExtra(AlarmClock.EXTRA_HOUR, hour)
        putExtra(AlarmClock.EXTRA_MINUTES, minute)
        putExtra(AlarmClock.EXTRA_MESSAGE, "Treksor · Wake gently")
        putExtra(AlarmClock.EXTRA_SKIP_UI, false)
        if (resource != 0) putExtra(AlarmClock.EXTRA_RINGTONE, "android.resource://${context.packageName}/$resource")
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      }
      if (intent.resolveActivity(context.packageManager) == null) throw IllegalStateException("No compatible Clock app is installed")
      context.startActivity(intent)
      // Opening the device Clock is not confirmation that its alarm was saved.
      "review-in-clock"
    }
  }
}
