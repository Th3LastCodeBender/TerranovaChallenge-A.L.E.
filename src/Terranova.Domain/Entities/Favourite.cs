namespace Terranova.Domain.Entities;

public class Favourite	
{
	public required string UserId { get; set; }
	// In potsgre questa diventa text NOT NULL
	public int RawgGameId { get; set; }
	// 
	public DateTime CreatedAt { get; set; }
}