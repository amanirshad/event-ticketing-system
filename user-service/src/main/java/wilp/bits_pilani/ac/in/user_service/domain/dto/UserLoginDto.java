package wilp.bits_pilani.ac.in.user_service.domain.dto;

import lombok.Data;

@Data
public class UserLoginDto {
    private String email;
    private String password;
}
