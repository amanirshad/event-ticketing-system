package wilp.bits_pilani.ac.in.user_service.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;
import wilp.bits_pilani.ac.in.user_service.domain.dto.UserLoginDto;
import wilp.bits_pilani.ac.in.user_service.domain.dto.UserRegistrationDto;
import wilp.bits_pilani.ac.in.user_service.domain.dto.UserResponseDto;
import wilp.bits_pilani.ac.in.user_service.domain.entity.User;
import wilp.bits_pilani.ac.in.user_service.service.UserService;

import java.util.Optional;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    private final BCryptPasswordEncoder encoder;

    public UserController(UserService userService) {
        this.userService = userService;
        this.encoder = new BCryptPasswordEncoder();
    }

    @PostMapping("/register")
    public ResponseEntity<UserResponseDto> register(@RequestBody UserRegistrationDto dto) {
        User user = userService.registerUser(dto);
        return generateUserResponseEntity(user);
    }

    private ResponseEntity<UserResponseDto> generateUserResponseEntity(User user) {
        UserResponseDto response = new UserResponseDto();
        response.setUserId(user.getUserId());
        response.setName(user.getName());
        response.setEmail(user.getEmail());
        response.setPhone(user.getPhone());
        response.setCreatedAt(user.getCreatedAt());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/login")
    public ResponseEntity<String> login(@RequestBody UserLoginDto dto) {
        Optional<User> userOpt = userService.findByEmail(dto.getEmail());
        if (userOpt.isPresent() && encoder.matches(dto.getPassword(), userOpt.get().getPassword())) {
            // For now, return a simple success; later add JWT
            return ResponseEntity.ok("Login successful");
        }
        return ResponseEntity.badRequest().body("Invalid credentials");
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserResponseDto> getProfile(@PathVariable Long id) {
        return userService.findById(id).map(user -> {
            return generateUserResponseEntity(user);
        }).orElse(ResponseEntity.notFound().build());
    }
}
