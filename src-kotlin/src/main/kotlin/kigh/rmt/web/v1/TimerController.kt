package kigh.rmt.web.v1

import kigh.rmt.timer.TimerId
import kigh.rmt.timer.TimerMetadata
import kigh.rmt.timer.TimerRepository
import org.springframework.web.bind.annotation.*

@RestController
class TimerController(private val timerRepository: TimerRepository) {

    @PutMapping(path = ["/v1/timer/{id}"])
    fun addTimer(@PathVariable id: String, @RequestParam(value = "name") name: String) {
        val metadata = TimerMetadata(TimerId(id), name)
        timerRepository.add(metadata)
    }

    @GetMapping(path = ["/v1/timers"])
    fun getTimers(): GetTimersResponse {
        return timerRepository.listMetadata().map { GetTimersResponse1(it.id.value(), it.name) }
    }
}

data class GetTimersResponse1(val id: String, val name: String)
private typealias GetTimersResponse = Collection<GetTimersResponse1>
